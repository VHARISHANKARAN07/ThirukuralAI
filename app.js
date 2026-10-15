// ==========================================================================
// KURAL VOICE — THIRUVALLUVAR MULTILINGUAL AI COMPANION (வள்ளுவர் உரையாடல்)
// ==========================================================================

import { kural as ALL_KURALS } from './assets/kurals-YMuDk2qh.js';
import { ATHIGARAMS, getAthigaramForKural } from './assets/athigarams.js';
import { 
  LANGUAGES, 
  getLanguage, 
  detectLanguageFromText, 
  translateText, 
  findTopicFromQuery,
  parseNumberFromQuery,
  extractLanguageAndCleanQuery,
  normalizeNumerals,
  detectAndAnalyzeSituation
} from './assets/languages.js';
import { speech } from './assets/speech.js';

// Application State
const state = {
  selectedLanguage: 'auto', // 'auto' or language code
  activeSpeechId: null,
  isListening: false,
  currentUser: null,
  chatHistory: []
};

// DOM Elements Cache
let elChatArea = null;
let elInput = null;
let elSendBtn = null;
let elMicBtn = null;
let elLangSelect = null;
let elTopicsRibbon = null;
let elAutoVoiceToggle = null;
let elGoogleSignInBtn = null;
let elSignOutBtn = null;
let elUserProfileBadge = null;
let elUserAvatarImg = null;
let elUserNameTxt = null;

// Initialize Application Robustly (handles deferred ES modules when document.readyState is already complete)
let appInitialized = false;
function startApp() {
  if (appInitialized) return;
  initDOM();
  initLanguageDropdown();
  initTopicChips();
  initEventListeners();
  initSpeechListener();
  initFirebaseAuth();
  
  // Welcome Initial Sage Blessing Message
  renderWelcomeMessage();
  appInitialized = true;
  console.info("Thirukural AI initialized successfully.");
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  // DOM is already parsed; initialize immediately!
  startApp();
}
window.addEventListener('load', startApp);

function initDOM() {
  elChatArea = document.getElementById('chatScrollArea');
  elInput = document.getElementById('chatInput');
  elSendBtn = document.getElementById('btnSend');
  elMicBtn = document.getElementById('btnMic');
  elLangSelect = document.getElementById('langSelectNative');
  elTopicsRibbon = document.getElementById('quickTopicsRibbon');
  elAutoVoiceToggle = document.getElementById('btnAutoVoiceToggle');
  elGoogleSignInBtn = document.getElementById('btnGoogleSignIn');
  elSignOutBtn = document.getElementById('btnSignOut');
  elUserProfileBadge = document.getElementById('userProfileBadge');
  elUserAvatarImg = document.getElementById('userAvatarImg');
  elUserNameTxt = document.getElementById('userNameTxt');
}

function initLanguageDropdown() {
  if (!elLangSelect) return;
  elLangSelect.innerHTML = `
    <option value="auto">🌐 Auto-Detect Language (தானியங்கு)</option>
    ${LANGUAGES.map(l => `<option value="${l.code}">${l.flag} ${l.name} (${l.englishName})</option>`).join('')}
  `;

  elLangSelect.addEventListener('change', (e) => {
    state.selectedLanguage = e.target.value;
    updateInputPlaceholder();
  });
}

function updateInputPlaceholder() {
  if (!elInput) return;
  if (state.selectedLanguage === 'auto') {
    elInput.placeholder = "Ask in Hindi, English, Tamil... 'theen' (3) / 'सच्चा मित्र कौन है?' / 'Control anger' / 'குறள் 10'";
  } else {
    const lang = getLanguage(state.selectedLanguage);
    elInput.placeholder = lang ? lang.promptLabel : "Ask Thiruvalluvar a question...";
  }
}

function initTopicChips() {
  if (!elTopicsRibbon) return;
  const chips = [
    { label: '🎲 நாள் ஒரு குறள்', query: 'random' },
    { label: '💔 துரோகம் (Betrayal)', query: 'My friend betrayed me after I helped him when he had nothing' },
    { label: '🧗 தோல்வி (Failed Exam / Work)', query: 'I worked so hard for my exam but failed. Feeling hopeless' },
    { label: '🔥 பழிவாங்கல் (Insult & Revenge)', query: 'Someone insulted me in public and I want revenge' },
    { label: '⏳ சோம்பல் (Procrastination)', query: 'I keep procrastinating on my work and feeling lazy' },
    { label: '🌧️ கைம்மாறு (No Appreciation)', query: 'I helped someone and they did not even say thank you' },
    { label: '🕉️ அறம் (Virtue / धर्म)', query: 'அறம்' },
    { label: '🤝 நட்பு (Friendship)', query: 'நட்பு' },
    { label: '❤️ அன்பு (Love)', query: 'அன்பு' },
    { label: '🧘 கோபம் (Anger)', query: 'கோபம்' }
  ];

  elTopicsRibbon.innerHTML = chips.map(c => `
    <button class="topic-chip" data-query="${c.query}">
      ${c.label}
    </button>
  `).join('');

  elTopicsRibbon.querySelectorAll('.topic-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.getAttribute('data-query');
      if (q === 'random') {
        fetchRandomKural();
      } else {
        processUserQuery(q);
      }
    });
  });
}

function initEventListeners() {
  // Handle form submission
  const chatForm = document.getElementById('chatForm');
  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      submitQuery();
    });
  }

  // Send message on click
  if (elSendBtn) {
    elSendBtn.addEventListener('click', (e) => {
      e.preventDefault();
      submitQuery();
    });
  }

  // Send message on Enter key
  if (elInput) {
    elInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitQuery();
      }
    });
  }

  // Voice Input (Microphone)
  if (elMicBtn) {
    elMicBtn.addEventListener('click', toggleVoiceInput);
  }

  // Sacred random kural button in header
  const btnHeaderRandom = document.getElementById('btnDailyKural') || document.getElementById('btnHeaderRandom');
  if (btnHeaderRandom) {
    btnHeaderRandom.addEventListener('click', fetchRandomKural);
  }

  // Auto Voice Toggle
  if (elAutoVoiceToggle) {
    elAutoVoiceToggle.addEventListener('click', () => {
      const isActive = speech.toggleAutoVoice();
      if (isActive) {
        elAutoVoiceToggle.classList.add('active');
        elAutoVoiceToggle.innerHTML = "🔊 தானியங்கு குரல் (ON)";
      } else {
        elAutoVoiceToggle.classList.remove('active');
        elAutoVoiceToggle.innerHTML = "🔇 தானியங்கு குரல் (OFF)";
        speech.stop();
      }
    });
  }
}

// Google Firebase Authentication Integration
function initFirebaseAuth() {
  // Global helper for sign in buttons anywhere in UI
  window.triggerGoogleSignIn = async () => {
    if (window.thiruKuralCloud && window.thiruKuralCloud.signIn) {
      try {
        await window.thiruKuralCloud.signIn();
      } catch (err) {
        console.error('Google Sign-In error:', err);
        alert('Google Sign-in: ' + (err.message || 'Please try again.'));
      }
    } else {
      alert('Firebase Auth is initializing. Please wait a moment and try again.');
    }
  };

  if (elGoogleSignInBtn) {
    elGoogleSignInBtn.addEventListener('click', window.triggerGoogleSignIn);
  }

  if (elSignOutBtn) {
    elSignOutBtn.addEventListener('click', async () => {
      if (window.thiruKuralCloud && window.thiruKuralCloud.signOut) {
        try {
          await window.thiruKuralCloud.signOut();
        } catch (err) {
          console.error('Sign-Out error:', err);
        }
      }
    });
  }

  // Listen for auth state changes dispatched by firebase-auth script
  window.addEventListener('thirukural:auth-state', (event) => {
    const user = event.detail?.user;
    updateAuthUI(user);
  });

  // Check initial state if already ready
  setTimeout(() => {
    if (window.thiruKuralCloud && window.thiruKuralCloud.getState) {
      const current = window.thiruKuralCloud.getState();
      if (current && current.user) {
        updateAuthUI(current.user);
      }
    }
  }, 500);
}

function updateAuthUI(user) {
  state.currentUser = user;
  if (user) {
    if (elGoogleSignInBtn) elGoogleSignInBtn.style.display = 'none';
    if (elUserProfileBadge) elUserProfileBadge.style.display = 'flex';
    if (elUserAvatarImg) {
      elUserAvatarImg.src = user.photoURL || 'https://lh3.googleusercontent.com/a/default-user';
    }
    if (elUserNameTxt) {
      elUserNameTxt.textContent = user.displayName || user.email?.split('@')[0] || 'User';
    }

    // Hide auth invite banners in chat
    document.querySelectorAll('.auth-invite-banner').forEach(b => b.style.display = 'none');
  } else {
    if (elGoogleSignInBtn) elGoogleSignInBtn.style.display = 'flex';
    if (elUserProfileBadge) elUserProfileBadge.style.display = 'none';
  }
}

function initSpeechListener() {
  speech.subscribe((stateUpdate) => {
    const allVoiceEqs = document.querySelectorAll('.audio-equalizer-pill');
    
    if (stateUpdate.speaking) {
      allVoiceEqs.forEach(eq => eq.style.display = 'inline-flex');
    } else {
      allVoiceEqs.forEach(eq => eq.style.display = 'none');
    }
  });
}

// Toggle Speech-to-Text (Microphone)
function toggleVoiceInput() {
  if (state.isListening) {
    speech.stopListening();
    setListeningUI(false);
  } else {
    const langToListen = state.selectedLanguage === 'auto' ? 'ta' : state.selectedLanguage;
    setListeningUI(true);

    speech.startListening(
      langToListen,
      (transcript, parsedNumber, directKuralData) => {
        setListeningUI(false);
        if (elInput) elInput.value = transcript || '';
        processUserQuery(transcript, directKuralData, parsedNumber);
      },
      (error) => {
        setListeningUI(false);
        console.warn('Speech recognition error:', error);
      },
      (stateObj) => {
        setListeningUI(stateObj.listening, stateObj.engine);
      }
    );
  }
}

function setListeningUI(isListening, engine = null) {
  state.isListening = isListening;
  if (!elMicBtn) return;
  if (isListening) {
    elMicBtn.classList.add('listening');
    if (engine === 'whisper') {
      elMicBtn.title = "🎙️ விஸ்பர் ASR கேட்கிறது... பேசுங்கள் (Whisper Indic ASR Listening...)";
    } else {
      elMicBtn.title = "🎙️ கேட்கிறது... பேசுங்கள் (Listening... Speak now)";
    }
  } else {
    elMicBtn.classList.remove('listening');
    elMicBtn.title = "குரல் வழி கேட்க (Speak via microphone)";
  }
}

// User submits query
function submitQuery() {
  if (!elInput) elInput = document.getElementById('chatInput');
  if (!elChatArea) elChatArea = document.getElementById('chatScrollArea');
  if (!elInput) return;
  const query = elInput.value.trim();
  if (!query) return;
  elInput.value = '';
  try { elInput.focus(); } catch (e) {}
  processUserQuery(query);
}

// Expose globally for inline DOM handlers
window.submitChatQuery = submitQuery;
window.processUserQuery = processUserQuery;

// Process Query and Generate Multilingual Kural Response
async function processUserQuery(query, directKuralData = null, parsedNumber = null) {
  if (!query && !directKuralData && !parsedNumber) return;
  if (!elChatArea) elChatArea = document.getElementById('chatScrollArea');

  // Stop any active audio before starting new query
  speech.stop();

  let loadingId = null;
  try {
    // Extract explicit language request if user typed e.g. "three in japanese", "kural 3 in hindi"
    const { cleanedQuery, explicitLang } = extractLanguageAndCleanQuery(query || '');

    // 1. Detect query language
    let userLang = state.selectedLanguage;
    if (explicitLang) {
      userLang = explicitLang;
    } else if (userLang === 'auto') {
      userLang = detectLanguageFromText(cleanedQuery || query || '');
    }
    const langObj = getLanguage(userLang);

    // 2. Append User Message to UI
    appendUserMessage(query || (directKuralData ? `குறள் ${directKuralData.number || directKuralData.Number}` : ''), langObj);

    // 3. Show Loading Sage Indicator
    loadingId = appendLoadingIndicator();

    // Check if query is a real-life situation, dilemma or story
    const situationAnalysis = (!directKuralData && !parsedNumber) ? detectAndAnalyzeSituation(query) : null;

    // 4. Search and find matching Thirukkural
    let matchedKural = null;
    if (directKuralData && (directKuralData.number || directKuralData.Number)) {
      const targetNum = directKuralData.number || directKuralData.Number;
      matchedKural = ALL_KURALS.find(k => k.Number == targetNum) || directKuralData;
    } else if (parsedNumber && parsedNumber >= 1 && parsedNumber <= 1330) {
      matchedKural = ALL_KURALS.find(k => k.Number == parsedNumber);
    } else if (situationAnalysis && situationAnalysis.kuralNumber) {
      // Direct high-confidence match for situational archetype
      matchedKural = ALL_KURALS.find(k => k.Number == situationAnalysis.kuralNumber);
    }

    if (!matchedKural) {
      // Prioritize cleaned query (e.g. "three" instead of "three in japanese")
      matchedKural = await findBestKural(cleanedQuery || query, userLang);
    }

    // Remove loading indicator
    removeLoadingIndicator(loadingId);
    loadingId = null;

    if (!matchedKural) {
      appendSageFallbackMessage(userLang);
      return;
    }

    // 5. Generate Response with Sage Counsel, Palm-Leaf, and User's language explanation
    await appendSageKuralResponse(matchedKural, query, userLang, situationAnalysis);

    // 6. Save to Firebase History if user is signed in
    if (state.currentUser && window.thiruKuralCloud && window.thiruKuralCloud.saveHistory) {
      try {
        window.thiruKuralCloud.saveHistory({
          query: (query || '').slice(0, 500),
          kind: 'kural',
          kuralNumber: matchedKural.Number,
          chapterNumber: Math.floor((matchedKural.Number - 1) / 10) + 1,
          language: userLang
        });
      } catch (e) {
        console.warn('Could not save history to Firestore:', e);
      }
    }
  } catch (err) {
    console.error('Error processing query:', err);
    if (loadingId) removeLoadingIndicator(loadingId);
  }
}

// Find best matching Kural
async function findBestKural(query, userLang) {
  // Strip pipe characters, cursor markers, and symbols
  const cleanQ = query.replace(/[|#@!?,.]+/g, ' ').toLowerCase().trim();
  if (!cleanQ) return ALL_KURALS[0];

  // A. Check for digits or Multilingual Number Words (e.g., "三", "さん", "san", "theen", "teen", "तीन", "trois", "drei", "tres", "kural 3", "10", "குறள் 1")
  const numParsed = parseNumberFromQuery(cleanQ);
  if (numParsed && numParsed >= 1 && numParsed <= 1330) {
    const direct = ALL_KURALS.find(k => k.Number === numParsed);
    if (direct) return direct;
  }

  // B. Check Athigaram (Chapter) Names in Tamil and English
  for (const ath of ATHIGARAMS) {
    const tName = ath.tamil.toLowerCase();
    const eName = ath.english.toLowerCase();
    if (cleanQ === tName || cleanQ.includes(tName) || (cleanQ.length >= 4 && cleanQ.includes(eName))) {
      const startNum = (ath.number - 1) * 10 + 1;
      const k = ALL_KURALS.find(item => item.Number === startNum);
      if (k) return k;
    }
  }

  // C. Check Multilingual Topic Dictionary (e.g., "dost", "gussa", "pyaar", "shiksha", "愛", "怒り", "友情", "真実")
  const topicMatch = findTopicFromQuery(cleanQ);
  if (topicMatch && topicMatch.defaultKural) {
    const k = ALL_KURALS.find(item => item.Number === topicMatch.defaultKural);
    if (k) return k;
  }

  // D. Direct Tamil Search (if query contains Tamil characters)
  const isTamil = userLang === 'ta' || /[\u0B80-\u0BFF]/.test(cleanQ);
  if (isTamil) {
    // 1. Direct line phrase match
    const directHit = ALL_KURALS.find(k => 
      k.Line1.includes(cleanQ) || 
      k.Line2.includes(cleanQ) ||
      `${k.Line1} ${k.Line2}`.includes(cleanQ)
    );
    if (directHit) return directHit;

    // 2. Tokenized Tamil search with scoring across verses & commentaries
    const stopWordsTa = new Set(['பற்றி', 'சொல்', 'சொல்லுங்கள்', 'கூறு', 'கூறுங்கள்', 'என்ன', 'என்றால்', 'விளக்கம்', 'வேண்டும்', 'ஒரு', 'குறள்', 'திருக்குறள்']);
    const taWords = cleanQ.split(/[\s,?.!]+/).filter(w => w.length >= 2 && !stopWordsTa.has(w));

    if (taWords.length > 0) {
      let bestScore = -1;
      let bestKural = null;

      for (const k of ALL_KURALS) {
        let score = 0;
        const lineText = `${k.Line1} ${k.Line2}`;
        const commText = `${k.sp || ''} ${k.mv || ''} ${k.mk || ''}`;
        const athigaram = getAthigaramForKural(k.Number);
        const athText = athigaram ? athigaram.tamil : '';

        for (const w of taWords) {
          if (athText.includes(w)) {
            score += 35;
          }
          if (lineText.includes(w)) {
            score += 25;
          } else if (commText.includes(w)) {
            score += 10;
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestKural = k;
        }
      }

      if (bestKural && bestScore > 0) {
        return bestKural;
      }
    }
    
    // For Tamil queries, do not call external English translation; default gracefully
    return ALL_KURALS[0];
  }

  // E. Multilingual / English Keyword Search (only for non-Tamil queries)
  let enQuery = cleanQ;
  if (userLang !== 'en') {
    try {
      enQuery = await translateText(cleanQ, 'en', userLang);
    } catch (e) {
      enQuery = cleanQ;
    }
  }

  const enStopwords = new Set([
    'what', 'how', 'when', 'does', 'tell', 'thiruvalluvar', 'kural', 'thirukural', 'thirukkural', 
    'about', 'says', 'should', 'with', 'the', 'and', 'for', 'you', 'can', 'are', 'who', 'which', 
    'that', 'this', 'give', 'show', 'please', 'meaning', 'verse', 'say', 'saying'
  ]);

  const words = enQuery.toLowerCase().split(/[\s,?.!]+/).filter(w => w.length > 2 && !enStopwords.has(w));

  if (words.length > 0) {
    let bestScore = -1;
    let bestKural = null;

    for (const k of ALL_KURALS) {
      let score = 0;
      const transText = `${k.Translation} ${k.couplet}`.toLowerCase();
      const explText = `${k.explanation}`.toLowerCase();
      const translitText = `${k.transliteration1} ${k.transliteration2}`.toLowerCase();
      const athigaram = getAthigaramForKural(k.Number);
      const athEnglish = athigaram ? athigaram.english.toLowerCase() : '';

      for (const w of words) {
        // Whole word check
        const regex = new RegExp(`\\b${w}\\b`, 'i');

        if (regex.test(athEnglish)) {
          score += 35;
        }
        if (regex.test(transText)) {
          score += 20;
        } else if (transText.includes(w)) {
          score += 8;
        }
        if (regex.test(explText)) {
          score += 15;
        } else if (explText.includes(w)) {
          score += 6;
        }
        if (translitText.includes(w)) {
          score += 5;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestKural = k;
      }
    }

    if (bestKural && bestScore > 0) {
      return bestKural;
    }
  }

  // Fallback to Kural 1 if nothing matched
  return ALL_KURALS[0];
}

// Fetch Random Daily Kural
function fetchRandomKural() {
  const randomKural = ALL_KURALS[Math.floor(Math.random() * ALL_KURALS.length)];
  const userLang = state.selectedLanguage === 'auto' ? 'ta' : state.selectedLanguage;
  appendUserMessage("🎲 நாள் ஒரு குறள் (Daily Sacred Kural)", getLanguage(userLang));
  appendSageKuralResponse(randomKural, "நாள் ஒரு குறள்", userLang);
}

// ==========================================================================
// RENDERERS & MESSAGE GENERATION
// ==========================================================================

function appendUserMessage(text, langObj) {
  if (!elChatArea) return;
  const row = document.createElement('div');
  row.className = 'message-row user';
  row.innerHTML = `
    <div class="message-bubble-user">
      <span class="user-lang-tag">${langObj.flag} ${langObj.name}</span>
      <div class="user-query-text">${escapeHtml(text)}</div>
    </div>
  `;
  elChatArea.appendChild(row);
  scrollToBottom();
}

function appendLoadingIndicator() {
  if (!elChatArea) return null;
  const id = 'loading_' + Date.now();
  const row = document.createElement('div');
  row.className = 'message-row bot';
  row.id = id;
  row.innerHTML = `
    <div class="bot-avatar-col">
      <div class="sage-mini-avatar">🪶</div>
      <div class="sage-name-label">வள்ளுவர்</div>
    </div>
    <div class="bot-response-content">
      <div class="explanation-card" style="display:flex; align-items:center; gap:10px; color:var(--gold-bright);">
        <div class="lamp-icon-box" style="width:28px; height:28px; font-size:14px;">🪔</div>
        <span>ஓலைச்சுவடியில் ஞானத்தை ஆய்ந்தறிகிறார்... (Seeking sacred verse...)</span>
      </div>
    </div>
  `;
  elChatArea.appendChild(row);
  scrollToBottom();
  return id;
}

function removeLoadingIndicator(id) {
  if (!id) return;
  const el = document.getElementById(id);
  if (el) el.remove();
}

// Welcome Message
function renderWelcomeMessage() {
  if (!elChatArea) return;
  const row = document.createElement('div');
  row.className = 'message-row bot';
  row.innerHTML = `
    <div class="bot-avatar-col">
      <div class="sage-mini-avatar">🪔</div>
      <div class="sage-name-label">வள்ளுவர்</div>
    </div>
    <div class="bot-response-content">
      <div class="welcome-sage-card">
        <div class="sage-avatar-ring">📜</div>
        <div class="welcome-text">
          <h2>வணக்கம் • ஆதிபகவன் முதற்றே உலகு</h2>
          <p>
            நான் <strong>திருவள்ளுவர்</strong>. வாழ்க்கையின் அனைத்து நிலைகளுக்கும் உகந்த 1330 அருங்குறள்களை எந்த மொழியிலும் என்னிடம் கேளுங்கள். 
            பதில் <strong>தூய தமிழோலைச் சுவடியில்</strong> முதலிலும், பின்னர் நீங்கள் பேசும் <strong>மொழியில் விளக்கத்துடனும் குரல் வழியிலும்</strong> வழங்கப்படும்.
          </p>
          ${!state.currentUser ? `
            <div class="auth-invite-banner">
              <p>☁️ உங்கள் குறள் தேடல்களைச் சேமிக்க <strong>Google மூலம் உள்நுழையலாம்</strong>.</p>
              <button class="btn-google-sign-in" type="button" onclick="window.triggerGoogleSignIn()">
                <svg class="google-svg" viewBox="0 0 24 24" width="16" height="16">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
  elChatArea.appendChild(row);
}

// Sage Fallback Message
function appendSageFallbackMessage(userLang) {
  if (!elChatArea) return;
  const row = document.createElement('div');
  row.className = 'message-row bot';
  row.innerHTML = `
    <div class="bot-avatar-col">
      <div class="sage-mini-avatar">🪔</div>
      <div class="sage-name-label">வள்ளுவர்</div>
    </div>
    <div class="bot-response-content">
      <div class="explanation-card">
        <p style="color:var(--gold-light);">
          அன்பரே, தங்களின் வினாவுக்கு இணையான குறளை அடையாளம் காண முடியவில்லை. வேறு நற்சொற்களைக் கொண்டோ அல்லது குறள் எண்ணைக் கொண்டோ (உதாரணமாக: "theen" / "குறள் 3" / "நட்பு") வினவுக.
        </p>
      </div>
    </div>
  `;
  elChatArea.appendChild(row);
  scrollToBottom();
}

// Master Response Renderer: Sacred Palm Leaf Scripture + Multilingual Explanations + Dual Auto-Voice
async function appendSageKuralResponse(kural, userQuery, userLang, situationAnalysis = null) {
  if (!elChatArea) return;
  
  const athigaram = getAthigaramForKural(kural.Number) || {
    number: Math.floor((kural.Number - 1) / 10) + 1,
    tamil: 'அதிகாரம்',
    english: 'Chapter',
    paalTamil: 'அறத்துப்பால்',
    paalEnglish: 'Virtue'
  };

  const langObj = getLanguage(userLang);
  const msgId = 'kural_msg_' + Date.now();

  // 0. Sage Counsel Formulation (if user described a life situation or story)
  let sageCounselHtml = "";
  let situationCounselText = "";
  if (situationAnalysis) {
    if (userLang === 'ta') {
      situationCounselText = situationAnalysis.counselTamil;
    } else if (userLang === 'en') {
      situationCounselText = situationAnalysis.counselEnglish;
    } else {
      try {
        situationCounselText = await translateText(situationAnalysis.counselEnglish, userLang, 'en');
      } catch (e) {
        situationCounselText = situationAnalysis.counselEnglish;
      }
    }

    sageCounselHtml = `
      <div class="sage-counsel-card">
        <div class="sage-counsel-header">
          <div class="sage-counsel-badge">
            <span>🪶 வள்ளுவர் நல்வாக்கு • Sage Counsel</span>
            <span class="sage-counsel-tag">${escapeHtml(situationAnalysis.titleTamil || '')} • ${escapeHtml(situationAnalysis.titleEnglish || '')}</span>
          </div>
        </div>
        <div class="sage-counsel-body">
          <p>${escapeHtml(situationCounselText)}</p>
        </div>
      </div>
    `;
  }

  // 1. Palm-Leaf Scripture HTML (Always Sacred Tamil First)
  const palmLeafHtml = `
    <div class="palm-leaf-scripture" id="palm_${msgId}">
      <!-- Palmyra binding cord holes -->
      <div class="palm-cord-hole left"></div>
      <div class="palm-cord-hole right"></div>

      <!-- Palm Header -->
      <div class="palm-header">
        <div class="kural-badge-sacred">
          <span>✦ குறள் ${kural.Number} • KURAL ${kural.Number} ✦</span>
        </div>
        <div class="athigaram-meta">
          ${athigaram.number}. ${athigaram.tamil} (${athigaram.english}) • ${athigaram.paalTamil}
        </div>
      </div>

      <!-- The Inscribed Tamil Couplet -->
      <div class="palm-verse-box">
        <div class="palm-line line1">${kural.Line1}</div>
        <div class="palm-line line2">${kural.Line2}</div>
      </div>

      <!-- Palm Toolbar -->
      <div class="palm-actions">
        <button class="palm-btn-pill primary btn-recite-tamil" data-kural-num="${kural.Number}">
          🔊 ஓலைச்சுவடி உச்சரிப்பு (Recite Kural)
        </button>
        <button class="palm-btn-pill btn-copy-verse" data-verse="${escapeHtml(kural.Line1 + '\n' + kural.Line2)}">
          📋 நகலெடு (Copy)
        </button>
        <button class="palm-btn-pill btn-toggle-translit" data-target="translit_${msgId}">
          🪶 உச்சரிப்பு வடிவம் (Phonetic)
        </button>
      </div>
    </div>
  `;

  // 2. Transliteration Section
  const translitHtml = `
    <div class="transliteration-box" id="translit_${msgId}" style="display:none;">
      <strong>Tamil Transliteration:</strong><br>
      Line 1: <em>${kural.transliteration1}</em><br>
      Line 2: <em>${kural.transliteration2}</em>
    </div>
  `;

  // 3. User Language Explanation Formulation
  let userLangExplanation = "";
  let userLangCouplet = "";
  if (userLang === 'ta') {
    userLangExplanation = kural.sp || kural.mv || kural.mk;
  } else if (userLang === 'en') {
    userLangCouplet = kural.Translation;
    userLangExplanation = kural.explanation;
  } else {
    // Dynamic multilingual translation to User's Language (e.g. Japanese, Hindi, French, German, Arabic, etc.)
    try {
      const transCouplet = await translateText(kural.Translation, userLang, 'en');
      const transExpl = await translateText(kural.explanation, userLang, 'en');
      userLangCouplet = transCouplet || kural.Translation;
      userLangExplanation = transExpl || kural.explanation;
    } catch (e) {
      userLangExplanation = kural.explanation;
    }
  }

  // 4. Multi-language Explanation Card with Speech Audio Button
  const userLangCardHtml = `
    <div class="user-lang-explanation-block">
      <div class="user-lang-header">
        <div class="user-lang-badge">
          ${langObj.flag} ${langObj.name} விளக்கம் (${langObj.englishName} Meaning)
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          <button class="btn-icon-sacred btn-speak-lang" data-lang="${userLang}">
            🔊 ${langObj.name} குரல் வழி கேட்க (Listen in ${langObj.englishName})
          </button>
          <button class="btn-icon-sacred btn-stop-speech" title="Stop Audio" style="padding:7px 10px;">
            ⏹️
          </button>
        </div>
      </div>
      <div class="user-lang-body">
        ${userLangCouplet ? `<div class="user-lang-couplet-quote" style="margin-bottom:8px; font-weight:600; color:var(--gold-bright);">❝ ${userLangCouplet} ❞</div>` : ''}
        <div>${userLangExplanation.replace(/\n/g, '<br>')}</div>
      </div>
    </div>
  `;

  // 5. Classic Tamil Scholars' Commentary (மு.வ, சாலமன் பாப்பையா, கருணாநிதி)
  const tamilScholarsHtml = `
    <div class="scholars-tabs-container">
      <div class="section-label">📜 தமிழறிஞர் உரைகள் (Classical Commentaries):</div>
      <div class="scholars-nav">
        <button class="scholar-tab-btn active" data-content="sp_${msgId}">சாலமன் பாப்பையா</button>
        <button class="scholar-tab-btn" data-content="mv_${msgId}">மு. வரதராசனார்</button>
        <button class="scholar-tab-btn" data-content="mk_${msgId}">மு. கருணாநிதி</button>
      </div>
      <div class="scholar-content" id="sp_${msgId}">${kural.sp || 'விளக்கம் கிடைக்கவில்லை'}</div>
      <div class="scholar-content" id="mv_${msgId}" style="display:none;">${kural.mv || 'விளக்கம் கிடைக்கவில்லை'}</div>
      <div class="scholar-content" id="mk_${msgId}" style="display:none;">${kural.mk || 'விளக்கம் கிடைக்கவில்லை'}</div>
    </div>
  `;

  // Assemble full row
  const row = document.createElement('div');
  row.className = 'message-row bot';
  row.innerHTML = `
    <div class="bot-avatar-col">
      <div class="sage-mini-avatar">🪔</div>
      <div class="sage-name-label">வள்ளுவர்</div>
    </div>
    <div class="bot-response-content">
      ${sageCounselHtml}
      ${palmLeafHtml}
      ${translitHtml}
      ${userLangCardHtml}
      <div class="explanation-card">
        ${tamilScholarsHtml}
      </div>
    </div>
  `;

  elChatArea.appendChild(row);
  scrollToBottom();

  // Attach dynamic button event listeners for this message
  attachMessageEventListeners(row, kural, userLangExplanation, userLang);

  // Auto Voice Output: Sacred Tamil Verse First -> Then Spoken Language Explanation + Counsel!
  const speechNarration = situationCounselText
    ? `${situationCounselText}. ${userLangExplanation}`
    : userLangExplanation;
  speech.speakTamilVerseThenExplanation(kural, speechNarration, userLang);
}

// Attach Event Listeners to New Message
function attachMessageEventListeners(rowEl, kural, userLangExplanation, userLang) {
  // Recite Tamil Kural Button
  const btnRecite = rowEl.querySelector('.btn-recite-tamil');
  if (btnRecite) {
    btnRecite.addEventListener('click', () => {
      const fullTamil = `${kural.Line1} ... ${kural.Line2}`;
      speech.speak(fullTamil, 'ta');
    });
  }

  // Copy Verse Button
  const btnCopy = rowEl.querySelector('.btn-copy-verse');
  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      const verse = btnCopy.getAttribute('data-verse');
      navigator.clipboard.writeText(verse).then(() => {
        const orig = btnCopy.innerHTML;
        btnCopy.innerHTML = "✓ நகலெடுக்கப்பட்டது (Copied!)";
        setTimeout(() => btnCopy.innerHTML = orig, 2000);
      });
    });
  }

  // Toggle Transliteration Button
  const btnTranslit = rowEl.querySelector('.btn-toggle-translit');
  if (btnTranslit) {
    btnTranslit.addEventListener('click', () => {
      const targetId = btnTranslit.getAttribute('data-target');
      const box = document.getElementById(targetId);
      if (box) {
        box.style.display = box.style.display === 'none' ? 'block' : 'none';
      }
    });
  }

  // Speak User Language Button
  const btnSpeakLang = rowEl.querySelector('.btn-speak-lang');
  if (btnSpeakLang) {
    btnSpeakLang.addEventListener('click', () => {
      speech.speak(userLangExplanation, userLang);
    });
  }

  // Stop Speech Button
  const btnStop = rowEl.querySelector('.btn-stop-speech');
  if (btnStop) {
    btnStop.addEventListener('click', () => {
      speech.stop();
    });
  }

  // Scholar Commentary Tabs (SP, MV, MK)
  const scholarBtns = rowEl.querySelectorAll('.scholar-tab-btn');
  scholarBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      scholarBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetId = btn.getAttribute('data-content');
      const contents = rowEl.querySelectorAll('.scholar-content');
      contents.forEach(c => {
        c.style.display = c.id === targetId ? 'block' : 'none';
      });
    });
  });
}

function scrollToBottom() {
  if (!elChatArea) return;
  setTimeout(() => {
    elChatArea.scrollTop = elChatArea.scrollHeight;
  }, 100);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
