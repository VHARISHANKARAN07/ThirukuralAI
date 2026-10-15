// Speech Engine: Multilingual Text-to-Speech & Speech-to-Text with Pure Classical Tamil Pronunciation
import { getLanguage } from './languages.js';

class SpeechController {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.voices = [];
    this.currentAudio = null;
    this.speakingState = false;
    this.listeners = new Set();
    this.speechRate = 0.95; // Classical measured cadence
    this.autoVoiceEnabled = true; // Auto-play voice on response
    this.outputVoiceLang = 'auto'; // Auto-match user's spoken/selected language
    this.audioQueue = [];
    this.isPlayingQueue = false;

    // Backend Whisper ASR & Audio Studio configuration
    this.backendUrl = 'http://localhost:8000';
    this.isBackendOnline = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.activeMediaStream = null;
    this.isRecordingWhisper = false;

    if (this.synth) {
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }

    // Speech Recognition setup (Browser fallback)
    const SpeechRecognition = typeof window !== 'undefined' 
      ? (window.SpeechRecognition || window.webkitSpeechRecognition) 
      : null;
    this.recognition = SpeechRecognition ? new SpeechRecognition() : null;
    if (this.recognition) {
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
    }

    // Check backend health asynchronously
    this.checkBackendHealth();
  }

  async checkBackendHealth() {
    try {
      const res = await fetch(`${this.backendUrl}/health`, { signal: AbortSignal.timeout ? AbortSignal.timeout(1500) : undefined });
      if (res.ok) {
        this.isBackendOnline = true;
        console.info('Thirukural Whisper ASR & Audio Backend connected at:', this.backendUrl);
        return true;
      }
    } catch (e) {
      this.isBackendOnline = false;
    }
    return false;
  }

  loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices() || [];
  }

  // Get the most natural native voice model for a language
  getBestVoice(langLocale) {
    if (!this.voices || this.voices.length === 0) {
      this.loadVoices();
    }
    const cleanLocale = (langLocale || '').toLowerCase().replace('_', '-');
    const baseLang = cleanLocale.split('-')[0];

    // Language-specific high quality voice models:
    const voicePreferences = {
      'ta': ['valluvar', 'pallavi', 'தமிழ்', 'tamil'],
      'ja': ['haruka', 'ichiro', 'ayumi', '日本語', 'japanese', 'kyoko', 'otoya', 'sayaka'],
      'hi': ['hemant', 'kalpana', 'हिन्दी', 'hindi', 'lekha', 'neerja'],
      'te': ['mohan', 'తెలుగు', 'telugu', 'chitra'],
      'ml': ['midhun', 'മലയാളം', 'malayalam', 'sobhana'],
      'kn': ['gagan', 'ಕನ್ನಡ', 'kannada', 'sapna'],
      'bn': ['bashkar', 'বাংলা', 'bengali', 'tanishaa'],
      'fr': ['paul', 'hortense', 'julie', 'français', 'french', 'thomas', 'amelie'],
      'de': ['hedda', 'stefan', 'deutsch', 'german', 'anna', 'katja'],
      'es': ['helena', 'laura', 'español', 'spanish', 'monica', 'jorge'],
      'zh': ['huihui', 'yaoyao', 'kangkang', '普通话', 'chinese', 'tingting'],
      'ar': ['naayf', 'العربية', 'arabic', 'maged', 'tarik'],
      'ru': ['irina', 'pavel', 'русский', 'russian', 'milena'],
      'it': ['elsa', 'cosimo', 'italiano', 'italian', 'alice'],
      'ko': ['heami', 'sunhi', '한국어', 'korean', 'yuna']
    };

    if (voicePreferences[baseLang]) {
      const keywords = voicePreferences[baseLang];
      const preferred = this.voices.find(v => {
        const vLang = v.lang.toLowerCase().replace('_', '-');
        const vName = v.name.toLowerCase();
        const matchesLang = vLang.startsWith(baseLang);
        const matchesName = keywords.some(k => vName.includes(k) || v.name.includes(k));
        return matchesLang && matchesName;
      });
      if (preferred) return preferred;
    }

    // Exact locale match (e.g. ja-JP, hi-IN, fr-FR)
    let match = this.voices.find(v => v.lang.toLowerCase().replace('_', '-') === cleanLocale);
    if (match) return match;

    // Base language match
    match = this.voices.find(v => v.lang.toLowerCase().startsWith(baseLang));
    if (match) return match;

    return null;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(state) {
    this.speakingState = state.speaking;
    this.listeners.forEach(fn => fn(state));
  }

  stop() {
    this.audioQueue = [];
    this.isPlayingQueue = false;

    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {}
    }
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {}
      this.currentAudio = null;
    }
    this.notify({ speaking: false, text: '' });
  }

  setRate(rate) {
    this.speechRate = Math.max(0.6, Math.min(1.5, rate));
  }

  setOutputVoiceLang(langCode) {
    this.outputVoiceLang = langCode || 'ta';
  }

  getOutputVoiceLang() {
    return this.outputVoiceLang;
  }

  toggleAutoVoice() {
    this.autoVoiceEnabled = !this.autoVoiceEnabled;
    return this.autoVoiceEnabled;
  }

  // Recite Sacred Tamil Kural with Pure Classical Meter (வெண்பா நடை)
  // Approach:
  // 1. Try Pre-Recorded Studio Human Audio (Project Madurai / Studio Cache / Backend /audio/{n}.mp3)
  // 2. Fallback to Classical Venpa Cadence:
  //    Line 1 (4 seers) -> 450ms Caesura Pause -> Line 2 (3 seers)
  async reciteTamilKural(kural, onEnd = null) {
    this.stop();
    if (!kural || !kural.Line1 || !kural.Line2) {
      if (onEnd) onEnd();
      return;
    }

    const cleanLine1 = kural.Line1.replace(/[\n\r]+/g, ' ').trim();
    const cleanLine2 = kural.Line2.replace(/[\n\r]+/g, ' ').trim();
    const verseText = `குறள் ${kural.Number}. ${cleanLine1}, ${cleanLine2}.`;

    this.notify({ speaking: true, text: verseText, langCode: 'ta' });

    // Step 1: Check Pre-recorded Studio Audio candidates (only if backend is verified online)
    const audioCandidates = [];
    if (this.isBackendOnline) {
      audioCandidates.push(`${this.backendUrl}/audio/${kural.Number}.mp3`);
    }
    audioCandidates.push(`./audio/${kural.Number}.mp3`);

    const tryStudioAudio = async (idx) => {
      if (idx >= audioCandidates.length) {
        // Fallback to Classical Venpa Metered Cadence immediately!
        this.reciteVenpaMeter(kural, onEnd);
        return;
      }

      const candidateUrl = audioCandidates[idx];
      try {
        const audio = new Audio(candidateUrl);
        audio.preload = 'auto';

        const playPromise = new Promise((resolve, reject) => {
          audio.oncanplaythrough = () => resolve(true);
          audio.onerror = () => reject(new Error('Audio candidate failed'));
          setTimeout(() => reject(new Error('Audio load timeout')), 600);
        });

        await playPromise;
        this.currentAudio = audio;
        audio.onended = () => {
          this.currentAudio = null;
          this.notify({ speaking: false, text: '' });
          if (onEnd) onEnd();
        };
        audio.onerror = () => {
          this.currentAudio = null;
          tryStudioAudio(idx + 1);
        };
        await audio.play();
      } catch (err) {
        tryStudioAudio(idx + 1);
      }
    };

    tryStudioAudio(0);
  }

  // Pure Classical Kural Venpa Meter Recitation with Caesura Pause
  // Line 1: 4 seers | Caesura: 450ms | Line 2: 3 seers | End Cadence: 600ms
  reciteVenpaMeter(kural, onEnd = null) {
    const cleanLine1 = kural.Line1.replace(/[\n\r]+/g, ' ').trim();
    const cleanLine2 = kural.Line2.replace(/[\n\r]+/g, ' ').trim();
    const announcement = `குறள் ${kural.Number}`;

    // Play Line with Audio element or fallback to Web Speech
    const playAudioSnippet = (text, rate = 0.90) => {
      return new Promise((resolve) => {
        let finished = false;
        const done = () => {
          if (!finished) {
            finished = true;
            this.currentAudio = null;
            resolve(true);
          }
        };

        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ta&client=tw-ob&q=${encodeURIComponent(text)}`;
        const audio = new Audio(url);
        audio.playbackRate = rate;
        this.currentAudio = audio;

        // Safety timeout so audio never hangs
        const safetyTimer = setTimeout(() => {
          this.speakViaWebSpeechSnippet(text, 'ta', done);
        }, 1800);

        audio.onended = () => {
          clearTimeout(safetyTimer);
          done();
        };
        audio.onerror = () => {
          clearTimeout(safetyTimer);
          this.speakViaWebSpeechSnippet(text, 'ta', done);
        };

        audio.play().catch(() => {
          clearTimeout(safetyTimer);
          this.speakViaWebSpeechSnippet(text, 'ta', done);
        });
      });
    };

    // Sequential Venpa pipeline with exact pauses
    (async () => {
      try {
        // 1. Kural Number Announcement
        await playAudioSnippet(announcement, 0.95);
        await new Promise(r => setTimeout(r, 250));

        // 2. Line 1 (4 seers)
        await playAudioSnippet(cleanLine1, 0.88);

        // 3. Classical Venpa Caesura Pause (Strict 450ms)
        await new Promise(r => setTimeout(r, 450));

        // 4. Line 2 (3 seers)
        await playAudioSnippet(cleanLine2, 0.88);

        // 5. Cadence Rest
        await new Promise(r => setTimeout(r, 400));

        this.notify({ speaking: false, text: '' });
        if (onEnd) onEnd();
      } catch (e) {
        console.warn('Venpa recitation error:', e);
        this.notify({ speaking: false, text: '' });
        if (onEnd) onEnd();
      }
    })();
  }

  // Snippet speaker for Web Speech fallback with meter
  speakViaWebSpeechSnippet(text, langCode, onComplete) {
    if (!this.synth) {
      if (onComplete) onComplete();
      return;
    }
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ta-IN';
      utterance.rate = 0.88;
      utterance.pitch = 1.0;
      utterance.onend = () => onComplete && onComplete();
      utterance.onerror = () => onComplete && onComplete();
      this.synth.speak(utterance);
    } catch (e) {
      if (onComplete) onComplete();
    }
  }

  // Recite Tamil verse first, then speak the explanation in selected voice language
  speakTamilVerseThenExplanation(kuralOrVerse, explanationText, queryLang = 'ta') {
    if (!this.autoVoiceEnabled) return;
    this.stop();

    // Determine target voice language:
    // 1. If user explicitly selected a voice language in toolbar (e.g. 'ta', 'hi', 'en')
    // 2. Otherwise match query language
    let voiceLang = this.outputVoiceLang;
    if (voiceLang === 'auto') {
      voiceLang = queryLang || 'ta';
    }

    // Step 1: Recite the Tamil Kural with authentic classical pronunciation
    let kuralObj = null;
    if (typeof kuralOrVerse === 'object' && kuralOrVerse !== null) {
      kuralObj = kuralOrVerse;
    } else if (typeof kuralOrVerse === 'string') {
      // Split lines if string passed
      const parts = kuralOrVerse.split('...');
      kuralObj = {
        Number: '',
        Line1: (parts[0] || '').trim(),
        Line2: (parts[1] || parts[0] || '').trim()
      };
    }

    if (!kuralObj) return;

    this.reciteTamilKural(kuralObj, () => {
      // Step 2: Once Tamil verse recitation finishes, speak explanation after a brief reverent pause (500ms)
      setTimeout(() => {
        if (!this.autoVoiceEnabled) return;
        if (!explanationText || !explanationText.trim()) return;

        // Clean up explanation (remove markdown tags or long repetitive labels)
        const cleanExplanation = explanationText
          .replace(/<[^>]*>/g, '')
          .replace(/விளக்கம்:/gi, '')
          .replace(/Explanation:/gi, '')
          .trim();

        if (cleanExplanation) {
          this.speak(cleanExplanation, voiceLang);
        }
      }, 500);
    });
  }

  // Speak text in any language with automatic sentence chaining
  async speak(text, langCode = 'ta', onEnd = null) {
    this.stop();
    if (!text || !text.trim()) {
      if (onEnd) onEnd();
      return;
    }

    const cleanText = text.replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
    this.notify({ speaking: true, text: cleanText, langCode });

    // If native voice is available in Web Speech API, use it
    const langInfo = getLanguage(langCode);
    const locale = langInfo ? langInfo.speechLocale : `${langCode}-IN`;
    const nativeVoice = this.getBestVoice(locale);

    // If native voice exists in browser and language is not Tamil (or Tamil voice is native)
    if (nativeVoice && langCode !== 'ta') {
      this.speakViaWebSpeech(cleanText, langCode, onEnd);
      return;
    }

    // Otherwise use Google TTS audio streaming with chunked queue
    this.playTextViaAudioChunks(cleanText, langCode, onEnd);
  }

  // Chunk long text into natural sentences (<= 160 chars) and play in sequence
  playTextViaAudioChunks(text, langCode, onEnd = null) {
    const chunks = [];
    const sentences = text.match(/[^.!?।\n]+[.!?।\n]*/g) || [text];
    
    let currentChunk = '';
    for (const s of sentences) {
      if ((currentChunk + ' ' + s).trim().length <= 160) {
        currentChunk = (currentChunk + ' ' + s).trim();
      } else {
        if (currentChunk) chunks.push(currentChunk);
        // If single sentence is itself > 160 chars, slice by comma or words
        if (s.length > 160) {
          const words = s.split(' ');
          let sub = '';
          for (const w of words) {
            if ((sub + ' ' + w).trim().length <= 160) {
              sub = (sub + ' ' + w).trim();
            } else {
              if (sub) chunks.push(sub);
              sub = w;
            }
          }
          if (sub) chunks.push(sub);
          currentChunk = '';
        } else {
          currentChunk = s.trim();
        }
      }
    }
    if (currentChunk) chunks.push(currentChunk);

    if (chunks.length === 0) {
      this.notify({ speaking: false, text: '' });
      if (onEnd) onEnd();
      return;
    }

    // Play chunks sequentially
    let index = 0;
    const playNext = () => {
      if (index >= chunks.length) {
        this.currentAudio = null;
        this.notify({ speaking: false, text: '' });
        if (onEnd) onEnd();
        return;
      }

      const chunk = chunks[index++];
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(langCode)}&client=tw-ob&q=${encodeURIComponent(chunk)}`;
      const audio = new Audio(url);
      audio.playbackRate = this.speechRate;
      this.currentAudio = audio;

      audio.onended = () => {
        playNext();
      };

      audio.onerror = () => {
        // Fallback to Web Speech for remaining text
        this.currentAudio = null;
        this.speakViaWebSpeech(chunks.slice(index - 1).join(' '), langCode, onEnd);
      };

      audio.play().catch(err => {
        console.warn('Audio play error, falling back:', err);
        this.speakViaWebSpeech(chunk, langCode, onEnd);
      });
    };

    playNext();
  }

  // Web Speech API execution
  speakViaWebSpeech(text, langCode, onEnd) {
    if (!this.synth) {
      this.notify({ speaking: false, text: '' });
      if (onEnd) onEnd();
      return;
    }

    try {
      if (this.synth.paused) {
        this.synth.resume();
      }

      const langInfo = getLanguage(langCode);
      const locale = langInfo ? langInfo.speechLocale : `${langCode}-IN`;
      const voice = this.getBestVoice(locale);

      const utterance = new SpeechSynthesisUtterance(text);
      if (voice) {
        utterance.voice = voice;
      }
      utterance.lang = locale;
      utterance.rate = this.speechRate;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        this.notify({ speaking: false, text: '' });
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        this.notify({ speaking: false, text: '' });
        if (onEnd) onEnd();
      };

      this.synth.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis exception:', err);
      this.notify({ speaking: false, text: '' });
      if (onEnd) onEnd();
    }
  }

  // Speech to Text (Microphone):
  // Supports Dual Mode:
  // 1. Whisper Indic ASR backend with domain prompting ('திருக்குறள், குறள் எண்...') when online
  // 2. Browser Web Speech Recognition fallback when offline
  async startListening(langCode, onResult, onError, onStateChange) {
    // Check if backend is available
    if (this.isBackendOnline && typeof navigator !== 'undefined' && navigator.mediaDevices && window.MediaRecorder) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.activeMediaStream = stream;
        this.audioChunks = [];

        const mimeType = (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('audio/webm;codecs=opus'))
          ? 'audio/webm;codecs=opus'
          : ((typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('audio/mp4')) ? 'audio/mp4' : '');

        const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        this.mediaRecorder = recorder;
        this.isRecordingWhisper = true;

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            this.audioChunks.push(e.data);
          }
        };

        recorder.onstart = () => {
          if (onStateChange) onStateChange({ listening: true, engine: 'whisper' });
        };

        recorder.onstop = async () => {
          if (onStateChange) onStateChange({ listening: false, engine: 'whisper' });
          this.isRecordingWhisper = false;

          // Release mic tracks
          if (this.activeMediaStream) {
            this.activeMediaStream.getTracks().forEach(t => t.stop());
            this.activeMediaStream = null;
          }

          if (this.audioChunks.length === 0) return;

          const blob = new Blob(this.audioChunks, { type: mimeType || 'audio/webm' });
          this.audioChunks = [];

          try {
            const formData = new FormData();
            formData.append('file', blob, 'user_voice.webm');
            if (langCode && langCode !== 'auto') {
              formData.append('language', langCode);
            }

            const resp = await fetch(`${this.backendUrl}/query-voice`, {
              method: 'POST',
              body: formData
            });

            if (resp.ok) {
              const data = await resp.json();
              if (onResult) {
                onResult(data.transcription, data.parsed_number, data.kural_data);
              }
              return;
            }
          } catch (uploadErr) {
            console.warn('Whisper backend upload failed, falling back:', uploadErr);
          }
        };

        recorder.start(250); // Collect chunks
        return;
      } catch (micErr) {
        console.warn('Microphone MediaRecorder failed, falling back to Web Speech:', micErr);
      }
    }

    // Fallback: Browser Web Speech Recognition
    if (!this.recognition) {
      if (onError) onError('Speech Recognition is not supported on this browser. Try typing instead.');
      return;
    }

    const langInfo = getLanguage(langCode);
    this.recognition.lang = langInfo ? langInfo.speechLocale : 'ta-IN';

    this.recognition.onstart = () => {
      if (onStateChange) onStateChange({ listening: true, engine: 'browser' });
    };

    this.recognition.onresult = (event) => {
      if (event.results && event.results[0] && event.results[0][0]) {
        const transcript = event.results[0][0].transcript;
        if (onResult) onResult(transcript, null, null);
      }
    };

    this.recognition.onerror = (event) => {
      if (onStateChange) onStateChange({ listening: false, engine: 'browser' });
      if (onError) onError(event.error);
    };

    this.recognition.onend = () => {
      if (onStateChange) onStateChange({ listening: false, engine: 'browser' });
    };

    try {
      this.recognition.start();
    } catch (err) {
      console.warn('Recognition start error:', err);
    }
  }

  stopListening() {
    // Stop MediaRecorder if recording Whisper
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {}
    }
    if (this.activeMediaStream) {
      try {
        this.activeMediaStream.getTracks().forEach(t => t.stop());
      } catch (e) {}
      this.activeMediaStream = null;
    }

    // Stop Web Speech
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }
}

export const speech = new SpeechController();
