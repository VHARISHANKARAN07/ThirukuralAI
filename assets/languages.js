// Multi-Language Support Engine for Thirukkural AI Companion
export const LANGUAGES = [
  { code: 'ta', name: 'தமிழ்', englishName: 'Tamil', flag: '🇮🇳', speechLocale: 'ta-IN', promptLabel: 'வணக்கம், கேளுங்கள்...' },
  { code: 'en', name: 'English', englishName: 'English', flag: '🇬🇧', speechLocale: 'en-US', promptLabel: 'Ask Thiruvalluvar a question...' },
  { code: 'hi', name: 'हिन्दी', englishName: 'Hindi', flag: '🇮🇳', speechLocale: 'hi-IN', promptLabel: 'तिरुवल्लुवर से पूछिए...' },
  { code: 'te', name: 'తెలుగు', englishName: 'Telugu', flag: '🇮🇳', speechLocale: 'te-IN', promptLabel: 'తిరువళ్ళువర్ గారిని అడగండి...' },
  { code: 'ml', name: 'മലയാളം', englishName: 'Malayalam', flag: '🇮🇳', speechLocale: 'ml-IN', promptLabel: 'തിരുവള്ളുവരോട് ചോദിക്കൂ...' },
  { code: 'kn', name: 'ಕನ್ನಡ', englishName: 'Kannada', flag: '🇮🇳', speechLocale: 'kn-IN', promptLabel: 'ತಿರುವಳ್ಳುವರ್ ಅವರನ್ನು ಕೇಳಿ...' },
  { code: 'bn', name: 'বাংলা', englishName: 'Bengali', flag: '🇮🇳', speechLocale: 'bn-IN', promptLabel: 'তিরুভাল্লুভারকে জিজ্ঞাসা করুন...' },
  { code: 'ar', name: 'العربية', englishName: 'Arabic', flag: '🇸🇦', speechLocale: 'ar-SA', promptLabel: 'اسأل الحكيم تيروفالوفار...' },
  { code: 'zh', name: '中文', englishName: 'Chinese', flag: '🇨🇳', speechLocale: 'zh-CN', promptLabel: '向蒂鲁瓦卢瓦尔请教...' },
  { code: 'es', name: 'Español', englishName: 'Spanish', flag: '🇪🇸', speechLocale: 'es-ES', promptLabel: 'Pregunta a Thiruvalluvar...' },
  { code: 'ja', name: '日本語', englishName: 'Japanese', flag: '🇯🇵', speechLocale: 'ja-JP', promptLabel: 'ティルヴァッルヴァルに尋ねる...' },
  { code: 'ur', name: 'اردو', englishName: 'Urdu', flag: '🇵🇰', speechLocale: 'ur-PK', promptLabel: 'تروولّوور سے پوچھیں...' },
  { code: 'de', name: 'Deutsch', englishName: 'German', flag: '🇩🇪', speechLocale: 'de-DE', promptLabel: 'Frage Thiruvalluvar...' },
  { code: 'fr', name: 'Français', englishName: 'French', flag: '🇫🇷', speechLocale: 'fr-FR', promptLabel: 'Demandez à Thiruvalluvar...' },
  { code: 'mr', name: 'मराठी', englishName: 'Marathi', flag: '🇮🇳', speechLocale: 'mr-IN', promptLabel: 'तिरुवल्लुवर यांना विचारा...' },
  { code: 'gu', name: 'ગુજરાતી', englishName: 'Gujarati', flag: '🇮🇳', speechLocale: 'gu-IN', promptLabel: 'તિરુવલ્લુવરને પૂછો...' },
  { code: 'ru', name: 'Русский', englishName: 'Russian', flag: '🇷🇺', speechLocale: 'ru-RU', promptLabel: 'Спросите Тируваллувара...' },
  { code: 'it', name: 'Italiano', englishName: 'Italian', flag: '🇮🇹', speechLocale: 'it-IT', promptLabel: 'Chiedi a Thiruvalluvar...' },
  { code: 'ko', name: '한국어', englishName: 'Korean', flag: '🇰🇷', speechLocale: 'ko-KR', promptLabel: '티루발루바르에게 물어보세요...' }
];

export function getLanguage(code) {
  return LANGUAGES.find(l => l.code === code) || LANGUAGES[0];
}

// ---------------------------------------------------------
// Unicode Numeral Normalizer: maps Fullwidth & Indic/Arabic digits to ASCII 0-9
// ---------------------------------------------------------
export function normalizeNumerals(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    // Fullwidth digits (０-９, \uFF10-\uFF19) -> 0-9 (Japanese IME default)
    .replace(/[\uFF10-\uFF19]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFF10 + 0x30))
    // Arabic-Indic digits (٠-٩) -> 0-9
    .replace(/[\u0660-\u0669]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x0660 + 0x30))
    // Eastern Arabic-Indic / Persian / Urdu (۰-۹) -> 0-9
    .replace(/[\u06F0-\u06F9]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x06F0 + 0x30))
    // Devanagari digits (०-९) -> 0-9
    .replace(/[\u0966-\u096F]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x0966 + 0x30))
    // Bengali digits (০-৯) -> 0-9
    .replace(/[\u09E6-\u09EF]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x09E6 + 0x30))
    // Tamil digits (௧-௯) -> 1-9
    .replace(/[\u0BE7-\u0BEF]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x0BE7 + 0x31))
    // Telugu digits (౦-౯) -> 0-9
    .replace(/[\u0C66-\u0C6F]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x0C66 + 0x30))
    // Kannada digits (೦-೯) -> 0-9
    .replace(/[\u0CE6-\u0CEF]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x0CE6 + 0x30))
    // Malayalam digits (൦-൯) -> 0-9
    .replace(/[\u0D66-\u0D6F]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x0D66 + 0x30))
    // Gujarati digits (૦-૯) -> 0-9
    .replace(/[\u0AE6-\u0AEF]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x0AE6 + 0x30));
}

// ---------------------------------------------------------
// Japanese & Chinese Kanji Numeral Parser (1 - 1330)
// ---------------------------------------------------------
export function parseKanjiNumerals(text) {
  if (!text || typeof text !== 'string') return null;
  const kanjiMap = { '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9 };
  const trimmed = text.trim();

  // Direct single character match: e.g. "三" -> 3
  if (kanjiMap[trimmed] !== undefined && kanjiMap[trimmed] >= 1) {
    return kanjiMap[trimmed];
  }

  // Multi-character Kanji numbers: e.g. "第3", "第三", "三番", "三番目", "百二十", "千三十三"
  const m = trimmed.match(/(?:第|クラーク|ティルックラル)?\s*([一二三四五六七八九十百千]+)\s*(?:番|番目|の句)?/);
  if (m && m[1]) {
    const s = m[1];
    let total = 0;
    let current = 0;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === '千') {
        total += (current || 1) * 1000;
        current = 0;
      } else if (c === '百') {
        total += (current || 1) * 100;
        current = 0;
      } else if (c === '十') {
        total += (current || 1) * 10;
        current = 0;
      } else if (kanjiMap[c] !== undefined) {
        current = kanjiMap[c];
      }
    }
    total += current;
    if (total >= 1 && total <= 1330) return total;
  }
  return null;
}

// ---------------------------------------------------------
// Universal Numeral Dictionary: Tamil, Japanese, English, Hindi,
// Telugu, Malayalam, French, German, Spanish, Arabic, etc.
// ---------------------------------------------------------
export const TAMIL_NUMERAL_DICT = {
  // Japanese Units & Common Words (Kanji, Hiragana, Katakana, Romaji)
  '三': 3, 'さん': 3, 'みっつ': 3, 'みつ': 3, 'サン': 3, 'スリー': 3, 'san': 3, 'mittsu': 3,
  '一': 1, 'いち': 1, 'ひとつ': 1, 'イチ': 1, 'ワン': 1, 'ichi': 1,
  '二': 2, 'に': 2, 'ふたつ': 2, 'ニ': 2, 'ツー': 2, 'ni': 2,
  '四': 4, 'よん': 4, 'し': 4, 'よっつ': 4, 'ヨン': 4, 'yon': 4, 'shi': 4,
  '五': 5, 'ご': 5, 'いつつ': 5, 'ゴ': 5, 'go': 5,
  '六': 6, 'ろく': 6, 'むっつ': 6, 'ロク': 6, 'roku': 6,
  '七': 7, 'なな': 7, 'しち': 7, 'ななつ': 7, 'ナナ': 7, 'nana': 7, 'shichi': 7,
  '八': 8, 'はち': 8, 'やっつ': 8, 'ハチ': 8, 'hachi': 8,
  '九': 9, 'きゅう': 9, 'く': 9, 'ここのつ': 9, 'キュウ': 9, 'kyu': 9, 'ku': 9,
  '十': 10, 'じゅう': 10, 'とお': 10, 'ジュウ': 10, 'ju': 10, 'jyu': 10,
  '百': 100, 'ひゃく': 100, 'hyaku': 100, '千': 1000, 'せん': 1000, 'sen': 1000,

  // French Units & Multiples
  'un': 1, 'premier': 1, 'deux': 2, 'trois': 3, 'troisieme': 3, 'troisième': 3,
  'quatre': 4, 'cinq': 5, 'six': 6, 'sept': 7, 'huit': 8, 'neuf': 9, 'dix': 10,
  'vingt': 20, 'trente': 30, 'quarante': 40, 'cinquante': 50, 'cent': 100, 'mille': 1000,

  // German Units & Multiples
  'eins': 1, 'erste': 1, 'zwei': 2, 'zweite': 2, 'drei': 3, 'dritte': 3,
  'vier': 4, 'fünf': 5, 'funf': 5, 'sechs': 6, 'sieben': 7, 'acht': 8, 'neun': 9, 'zehn': 10,
  'zwanzig': 20, 'dreißig': 30, 'dreissig': 30, 'vierzig': 40, 'fünfzig': 50, 'hundert': 100, 'tausend': 1000,

  // Spanish Units & Multiples
  'uno': 1, 'primero': 1, 'dos': 2, 'segundo': 2, 'tres': 3, 'tercero': 3,
  'cuatro': 4, 'cinco': 5, 'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10,
  'veinte': 20, 'treinta': 30, 'cuarenta': 40, 'cincuenta': 50, 'cien': 100, 'mil': 1000,

  // Italian Units & Multiples
  'due': 2, 'tre': 3, 'terzo': 3, 'quattro': 4, 'cinque': 5, 'sette': 7, 'otto': 8, 'nove': 9, 'dieci': 10,

  // Russian Units & Multiples
  'один': 1, 'два': 2, 'три': 3, 'четыре': 4, 'пять': 5, 'шесть': 6, 'семь': 7, 'восемь': 8, 'девять': 9, 'десять': 10, 'сто': 100, 'тысяча': 1000,

  // Arabic Units & Words
  'واحد': 1, 'اول': 1, 'اثنان': 2, 'اثنين': 2, 'ثلاثة': 3, 'ثلاث': 3, 'ثالث': 3,
  'اربعة': 4, 'اربع': 4, 'خمسة': 5, 'خمس': 5, 'ستة': 6, 'سبعة': 7, 'ثمانية': 8, 'تسعة': 9, 'عشرة': 10, 'مئة': 100, 'الف': 1000,

  // Telugu Units & Words
  'ఒకటి': 1, 'రెండు': 2, 'మూడు': 3, 'నాలుగు': 4, 'ఐదు': 5, 'ఆరు': 6, 'ఏడు': 7, 'ఎనిమిది': 8, 'తొమ్మిది': 9, 'పది': 10, 'వంద': 100, 'వెయ్యి': 1000,

  // Malayalam Units & Words
  'ഒന്ന്': 1, 'രണ്ട്': 2, 'മൂന്ന്': 3, 'നാല്': 4, 'അഞ്ച്': 5, 'ആറ്': 6, 'ഏഴ്': 7, 'എട്ട്': 8, 'ഒൻപത്': 9, 'പത്ത്': 10, 'നൂറ്': 100, 'ആയിരം': 1000,

  // Kannada Units & Words
  'ಒಂದು': 1, 'ಎರಡು': 2, 'ಮೂರು': 3, 'ನಾಲ್ಕು': 4, 'ಐದು': 5, 'ಆರು': 6, 'ಏಳು': 7, 'ಎಂಟು': 8, 'ಒಂಬತ್ತು': 9, 'ಹತ್ತು': 10, 'ನೂರು': 100, 'ಸಾವಿರ': 1000,

  // Bengali Units & Words
  'এক': 1, 'দুই': 2, 'তিন': 3, 'চার': 4, 'পাঁচ': 5, 'ছয়': 6, 'সাত': 7, 'আট': 8, 'নয়': 9, 'দশ': 10, 'একশ': 100, 'হাজার': 1000,

  // Korean Units & Words
  '일': 1, '하나': 1, '이': 2, '둘': 2, '삼': 3, '셋': 3, '사': 4, '넷': 4, '오': 5, '다섯': 5, '육': 6, '칠': 7, '팔': 8, '구': 9, '십': 10,

  // Hindi & Urdu Units
  'एक': 1, 'पहला': 1, 'दो': 2, 'दूसरा': 2, 'तीन': 3, 'तीसरा': 3, 'theen': 3, 'teen': 3,
  'चार': 4, 'चौथा': 4, 'char': 4, 'chaar': 4,
  'पांच': 5, 'पाँच': 5, 'पांचवां': 5, 'paanch': 5,
  'छह': 6, 'छठा': 6, 'chhah': 6, 'che': 6,
  'सात': 7, 'सातवां': 7, 'saat': 7,
  'ஆठ': 8, 'आठ': 8, 'आठवां': 8, 'aath': 8,
  'नौ': 9, 'नौवां': 9, 'nau': 9,
  'दस': 10, 'दसवां': 10, 'das': 10,
  'सौ': 100, 'sau': 100, 'हज़ार': 1000, 'hazaar': 1000,

  // English Units
  'one': 1, 'first': 1, 'two': 2, 'second': 2, 'three': 3, 'third': 3, 'four': 4, 'fourth': 4,
  'five': 5, 'fifth': 5, 'six': 6, 'sixth': 6, 'seven': 7, 'seventh': 7, 'eight': 8, 'eighth': 8,
  'nine': 9, 'ninth': 9, 'ten': 10, 'tenth': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
  'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19,
  'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70, 'eighty': 80,
  'ninety': 90, 'hundred': 100, 'thousand': 1000,

  // Tamil Units (1 - 9)
  'ஒன்று': 1, 'ஒண்ணு': 1, 'முதலாம்': 1, 'முதல்': 1, 'முதலாவது': 1, 'onnu': 1, 'ondru': 1, 'mudhal': 1,
  'இரண்டு': 2, 'ரெண்டு': 2, 'இரண்டாம்': 2, 'ரெண்டாம்': 2, 'இரண்டாவது': 2, 'rendu': 2, 'irandu': 2, 'rendam': 2, 'irandam': 2,
  'மூன்று': 3, 'மூணு': 3, 'மூன்றாம்': 3, 'மூணாம்': 3, 'மூன்றாவது': 3, 'moonu': 3, 'moondru': 3, 'moondram': 3,
  'நான்கு': 4, 'நாலு': 4, 'நான்காம்': 4, 'நாலாம்': 4, 'நான்காவது': 4, 'naalu': 4, 'naanku': 4, 'naangam': 4,
  'ஐந்து': 5, 'அஞ்சு': 5, 'ஐந்தாம்': 5, 'அஞ்சாம்': 5, 'ஐந்தாவது': 5, 'anju': 5, 'ainthu': 5, 'aindham': 5, 'anjam': 5,
  'ஆறு': 6, 'ஆறாம்': 6, 'ஆறாவது': 6, 'aaru': 6, 'aaram': 6,
  'ஏழு': 7, 'ஏழாம்': 7, 'ஏழாவது': 7, 'ezhu': 7, 'yezhu': 7, 'ezham': 7,
  'எட்டு': 8, 'எட்டாம்': 8, 'எட்டாவது': 8, 'ettu': 8, 'yettu': 8, 'ettam': 8,
  'ஒன்பது': 9, 'ஒன்பதாம்': 9, 'ஒன்பதாவது': 9, 'onbadhu': 9, 'onbathu': 9, 'onbadham': 9,

  // Tamil Teens (11 - 19)
  'பதினொன்று': 11, 'பதினொன்றாம்': 11, 'பதினொண்ணு': 11, 'pathinonnu': 11, 'pathinondru': 11,
  'பன்னிரண்டு': 12, 'பன்னிரண்டாம்': 12, 'pannirendu': 12, 'pannirandu': 12,
  'பதின்மூன்று': 13, 'பதின்மூன்றாம்': 13, 'பதின்மூணு': 13, 'pathimoonu': 13, 'pathimoondru': 13,
  'பதினான்கு': 14, 'பதினான்காம்': 14, 'பதினாலு': 14, 'pathinaalu': 14,
  'பதினைந்து': 15, 'பதினைந்தாம்': 15, 'பதினஞ்சு': 15, 'pathinanju': 15,
  'பதினாறு': 16, 'பதினாறாம்': 16, 'pathinaaru': 16,
  'பதினேழு': 17, 'பதினேழாம்': 17, 'pathinezhu': 17,
  'பதினெட்டு': 18, 'பதினெட்டாம்': 18, 'pathinettu': 18,
  'பத்தொன்பது': 19, 'பத்தொன்பதாம்': 19, 'pathonbadhu': 19,

  // Tamil Tens & Multiples (10 - 90)
  'பத்து': 10, 'பத்தாம்': 10, 'பத்தாவது': 10, 'pathu': 10, 'paththu': 10, 'patham': 10, 'pathaam': 10,
  'இருபது': 20, 'இருபதாம்': 20, 'இருபத்தி': 20, 'இருபத்து': 20, 'irubathu': 20, 'iruvathu': 20,
  'முப்பது': 30, 'முப்பதாம்': 30, 'முப்பத்தி': 30, 'முப்பத்து': 30, 'muppathu': 30, 'muppadhu': 30,
  'நாற்பது': 40, 'நாற்பதாம்': 40, 'நாற்பத்தி': 40, 'நாற்பத்து': 40, 'narpathu': 40, 'naarpathu': 40,
  'ஐம்பது': 50, 'ஐம்பதாம்': 50, 'ஐம்பத்தி': 50, 'ஐம்பத்து': 50, 'aimbathu': 50, 'aimbadhu': 50,
  'அறுபது': 60, 'அறுபதாம்': 60, 'அறுபத்தி': 60, 'அறுபத்து': 60, 'arubathu': 60,
  'எழுபது': 70, 'எழுபதாம்': 70, 'எழுபத்தி': 70, 'எழுபத்து': 70, 'ezhubathu': 70,
  'எண்பது': 80, 'எண்பதாம்': 80, 'எண்பத்தி': 80, 'எண்பத்து': 80, 'enbathu': 80,
  'தொண்ணூறு': 90, 'தொண்ணூறாம்': 90, 'தொண்ணூற்றி': 90, 'தொண்ணூற்று': 90, 'thonnooru': 90,

  // Tamil Hundreds (100 - 900)
  'நூறு': 100, 'நூறாம்': 100, 'நூற்று': 100, 'nooru': 100, 'nooram': 100, 'nootru': 100,
  'இருநூறு': 200, 'இருநூறாம்': 200, 'இருநூற்று': 200, 'irunooru': 200,
  'முந்நூறு': 300, 'முந்நூறாம்': 300, 'munnooru': 300,
  'நானூறு': 400, 'naanooru': 400,
  'ஐந்நூறு': 500, 'ainnooru': 500,
  'அறுநூறு': 600, 'arunooru': 600,
  'எழுநூறு': 700, 'ezhunooru': 700,
  'எண்ணூறு': 800, 'ennooru': 800,
  'தொள்ளாயிரம்': 900, 'thollayiram': 900,

  // Tamil Thousands (1000)
  'ஆயிரம்': 1000, 'ஆயிரத்து': 1000, 'ஆயிரத்தாம்': 1000, 'ayiram': 1000, 'aayiram': 1000
};

// Sorted tokens descending by length for greedy parsing without sub-token collision
const SORTED_NUMERAL_TOKENS = Object.keys(TAMIL_NUMERAL_DICT).sort((a, b) => b.length - a.length);

// ---------------------------------------------------------
// Extract Target Language from Natural Language Phrases:
// e.g. "three in japanese" -> { cleanedQuery: "three", explicitLang: "ja" }
// e.g. "kural 10 in hindi" -> { cleanedQuery: "kural 10", explicitLang: "hi" }
// ---------------------------------------------------------
export function extractLanguageAndCleanQuery(query) {
  if (!query || typeof query !== 'string') return { cleanedQuery: query, explicitLang: null };
  let q = query.trim();
  let explicitLang = null;

  const langPatterns = [
    { regex: /\b(?:in|to)\s+(japanese|nihongo|japan)\b/i, code: 'ja' },
    { regex: /\b(?:in|to)\s+(hindi)\b/i, code: 'hi' },
    { regex: /\b(?:in|to)\s+(tamil)\b/i, code: 'ta' },
    { regex: /\b(?:in|to)\s+(french|francais|français)\b/i, code: 'fr' },
    { regex: /\b(?:in|to)\s+(german|deutsch)\b/i, code: 'de' },
    { regex: /\b(?:in|to)\s+(spanish|espanol|español)\b/i, code: 'es' },
    { regex: /\b(?:in|to)\s+(telugu)\b/i, code: 'te' },
    { regex: /\b(?:in|to)\s+(malayalam)\b/i, code: 'ml' },
    { regex: /\b(?:in|to)\s+(kannada)\b/i, code: 'kn' },
    { regex: /\b(?:in|to)\s+(bengali|bangla)\b/i, code: 'bn' },
    { regex: /\b(?:in|to)\s+(arabic)\b/i, code: 'ar' },
    { regex: /\b(?:in|to)\s+(chinese|mandarin)\b/i, code: 'zh' },
    { regex: /\b(?:in|to)\s+(russian)\b/i, code: 'ru' },
    { regex: /\b(?:in|to)\s+(italian)\b/i, code: 'it' },
    { regex: /\b(?:in|to)\s+(korean)\b/i, code: 'ko' },
    { regex: /\b(?:in|to)\s+(urdu)\b/i, code: 'ur' },
    { regex: /\b(?:in|to)\s+(marathi)\b/i, code: 'mr' },
    { regex: /\b(?:in|to)\s+(gujarati)\b/i, code: 'gu' },
    { regex: /\b(?:in|to)\s+(english)\b/i, code: 'en' },
    { regex: /日本語で|日本語/i, code: 'ja' },
    { regex: /हिन्दी में|हिंदी में/i, code: 'hi' },
    { regex: /தமிழில்/i, code: 'ta' }
  ];

  for (const lp of langPatterns) {
    if (lp.regex.test(q)) {
      explicitLang = lp.code;
      q = q.replace(lp.regex, ' ').replace(/\s+/g, ' ').trim();
      break;
    }
  }

  return { cleanedQuery: q, explicitLang };
}

// Strictly parses numeric input N (1 - 1330)
// Handles:
// 1. Direct digits ('10', '42', '1330', fullwidth '３')
// 2. Japanese & Chinese Kanji numerals ('三', '第三', '3番目', 'クラーク3')
// 3. Spoken Tamil ordinals & numerals ('பத்தாம் திருக்குறள்', 'முதலாம் குறள்')
// 4. Multilingual number words ('san', 'theen', 'trois', 'drei', 'tres', 'teen', 'three in japanese')
// 5. Compound numbers ('ஆயிரத்து முப்பத்து மூன்று' -> 1033, '百二十' -> 120)
export function parseNumericN(query) {
  if (!query || typeof query !== 'string') return null;

  // Step 1: Normalize all fullwidth (Japanese) & Indic numerals to standard ASCII 0-9
  const normalized = normalizeNumerals(query).trim().toLowerCase();
  if (!normalized) return null;

  // Step 2: Check Japanese & Chinese Kanji Numerals (e.g. "三", "第三", "三番", "三番目")
  const kanjiVal = parseKanjiNumerals(query);
  if (kanjiVal && kanjiVal >= 1 && kanjiVal <= 1330) {
    return kanjiVal;
  }

  // Step 3: Exact numeric digits: '3', '42', '1330'
  if (/^[0-9]{1,4}$/.test(normalized)) {
    const n = parseInt(normalized, 10);
    if (n >= 1 && n <= 1330) return n;
  }

  // Step 4: Number with prefix/suffix in Tamil, English, Japanese, French, German, Spanish:
  // e.g. 'kural 3', 'クラーク3', '第3', '3番目', '3の句', 'குறள் 5', '#100'
  const patterns = [
    /(?:thirukural|thirukkural|திருக்குறள்|kural|குறள்|number|எண்|no\.?|#)\s*#?\s*([0-9]{1,4})/i,
    /([0-9]{1,4})\s*(?:st|nd|rd|th|வது|ஆவது)?\s*(?:kural|குறள்|thirukural)/i,
    /(?:クラーク|ティルックラル|第)\s*([0-9]{1,4})\s*(?:番|番目|の句)?/i,
    /([0-9]{1,4})\s*(?:番|番目|の句)/i,
    /(?:couplet|vers|versiculo|versículo|strophe)\s*([0-9]{1,4})/i,
    /#([0-9]{1,4})/
  ];

  for (const pat of patterns) {
    const match = normalized.match(pat);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n >= 1 && n <= 1330) return n;
    }
  }

  // Step 5: Isolated digits anywhere in the query (e.g. "tell me about 42" or "3 in japanese")
  const isolated = normalized.match(/\b([0-9]{1,4})\b/);
  if (isolated) {
    const n = parseInt(isolated[1], 10);
    if (n >= 1 && n <= 1330) return n;
  }

  // Step 6: Multi-lingual Word Greedy Accumulator
  // Avoid greedily matching words if query is a conceptual topic query (e.g. "how to control anger" or "what is friendship")
  const isConceptualTopic = /\b(friend|friends|friendship|love|anger|god|rain|virtue|family|children|education|truth|poverty|wealth|king|minister|army|dharma)\b/i.test(normalized);
  if (isConceptualTopic) {
    return null;
  }

  // Remove common conversational filler words to isolate numerals
  const fillerRegex = /(?:திருக்குறள்|குறள்|பற்றி|சொல்|கூறு|விளக்கம்|thirukural|thirukkural|kural|number|verse|couplet|please|tell|give|show|me|about|what|is|say|meaning|explain|in|to|language|japanese|hindi|tamil|english)/gi;
  let isolatedText = normalized.replace(fillerRegex, ' ').replace(/\s+/g, ' ').trim();

  let accumulatedSum = 0;
  let tempText = isolatedText;

  for (const token of SORTED_NUMERAL_TOKENS) {
    const isNonAscii = /[^\x00-\x7F]/.test(token);
    let matched = false;

    if (isNonAscii) {
      if (tempText.includes(token)) {
        matched = true;
        tempText = tempText.replace(token, ' ');
      }
    } else {
      // Latin tokens match on whole word boundaries to prevent substring collision
      const re = new RegExp(`(?:^|\\b)${token}(?:\\b|$)`, 'i');
      if (re.test(tempText)) {
        matched = true;
        tempText = tempText.replace(re, ' ');
      }
    }

    if (matched) {
      accumulatedSum += TAMIL_NUMERAL_DICT[token];
    }
  }

  if (accumulatedSum >= 1 && accumulatedSum <= 1330) {
    return accumulatedSum;
  }

  // Step 7: Tokenized fallback for individual words (e.g. "san", "trois", "drei", "tres", "teen")
  const tokens = normalized.split(/[\s,?.!]+/).filter(Boolean);
  if (tokens.length <= 4) {
    for (const token of tokens) {
      if (TAMIL_NUMERAL_DICT[token]) {
        const val = TAMIL_NUMERAL_DICT[token];
        if (val >= 1 && val <= 1330) return val;
      }
    }
  }

  return null;
}

// Alias for backwards compatibility
export const parseNumberFromQuery = parseNumericN;

// Detect language from text using Unicode character blocks & Romanized words
export function detectLanguageFromText(text) {
  if (!text || typeof text !== 'string') return 'ta';

  // 1. Check explicit language indicators
  const { explicitLang } = extractLanguageAndCleanQuery(text);
  if (explicitLang) return explicitLang;

  // 2. Japanese Hiragana & Katakana check (MUST be before generic CJK to avoid false Chinese tagging)
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja';

  // 3. Korean Hangul
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(text)) return 'ko';

  // 4. Tamil
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';

  // 5. Telugu
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te';

  // 6. Malayalam
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml';

  // 7. Kannada
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn';

  // 8. Bengali
  if (/[\u0980-\u09FF]/.test(text)) return 'bn';

  // 9. Gujarati
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gu';

  // 10. Devanagari (Hindi / Marathi)
  if (/[\u0900-\u097F]/.test(text)) return 'hi';

  // 11. Arabic / Urdu
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';

  // 12. Russian / Cyrillic
  if (/[\u0400-\u04FF]/.test(text)) return 'ru';

  // 13. CJK Ideographs (Kanji/Hanzi): default to Japanese in this application context
  if (/[\u4E00-\u9FFF]/.test(text)) return 'ja';

  const lower = text.toLowerCase();

  // Romanized Japanese words
  if (/\b(san|mittsu|ichi|ni|yon|roku|nana|hachi|kyu|ju|arigato|konnichiwa|sayonara|kural|nihon|nihongo)\b/i.test(lower)) {
    return 'ja';
  }

  // Romanized Hindi / Hinglish detection
  if (/\b(krodh|gussa|dost|dosti|pyaar|prem|shiksha|naam|kya|kaise|kare|hona|chahiye|mitr|bachhe|paisa|dharm|sach|theen|teen|ek|do|char|paanch)\b/i.test(lower)) {
    return 'hi';
  }

  // Latin script languages
  if (/\b(le|la|les|des|un|une|est|que|pour|comment|pourquoi|avec|dans|sur|trois|deux)\b/i.test(lower)) return 'fr';
  if (/\b(el|la|los|las|un|una|es|del|que|para|cómo|por qué|amigo|amor|tres|dos)\b/i.test(lower)) return 'es';
  if (/\b(der|die|das|und|ist|nicht|für|wie|warum|mit|von|drei|zwei|eins)\b/i.test(lower)) return 'de';
  if (/\b(il|la|gli|le|un|uno|una|che|per|come|perché|con|due|tre)\b/i.test(lower)) return 'it';

  return 'en';
}

// In-memory + LocalStorage Persistent Translation Cache
const translationCache = new Map();

function getCachedTranslation(sourceLang, targetLang, text) {
  const cacheKey = `${sourceLang}|${targetLang}:${text}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('kural_t_' + cacheKey);
      if (stored) {
        translationCache.set(cacheKey, stored);
        return stored;
      }
    }
  } catch (e) {}
  return null;
}

function setCachedTranslation(sourceLang, targetLang, text, result) {
  if (!result || result === text) return;
  const cacheKey = `${sourceLang}|${targetLang}:${text}`;
  translationCache.set(cacheKey, result);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('kural_t_' + cacheKey, result);
    }
  } catch (e) {}
}

// ---------------------------------------------------------
// Robust Multilingual Translation Engine with Multi-Provider Fallbacks
// ---------------------------------------------------------
export async function translateText(text, targetLang, sourceLang = 'en') {
  if (!text || !targetLang || targetLang === sourceLang) return text;

  // Check persistent cache first
  const cached = getCachedTranslation(sourceLang, targetLang, text);
  if (cached) return cached;

  // Provider 1: Try local backend /translate endpoint (if backend is running)
  try {
    const backendUrl = 'http://localhost:8000';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const resp = await fetch(`${backendUrl}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, target_lang: targetLang, source_lang: sourceLang }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (resp.ok) {
      const data = await resp.json();
      if (data && data.translated_text && data.translated_text !== text) {
        setCachedTranslation(sourceLang, targetLang, text, data.translated_text);
        return data.translated_text;
      }
    }
  } catch (backendErr) {
    // Backend offline or endpoint unavailable, proceed to Provider 2
  }

  // Provider 2: MyMemory API with 5.5s realistic timeout
  try {
    const encoded = encodeURIComponent(text);
    const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=${sourceLang}|${targetLang}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5500);

    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.responseData && data.responseData.translatedText) {
        let result = data.responseData.translatedText;
        result = result.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
        // Validate result is not a warning string
        if (!result.includes('MYMEMORY WARNING') && !result.includes('QUERY LENGTH LIMIT') && result !== text) {
          setCachedTranslation(sourceLang, targetLang, text, result);
          return result;
        }
      }
    }
  } catch (err) {
    // Proceed to Provider 3
  }

  // Provider 3: Lingva Public Mirror Fallback
  try {
    const encoded = encodeURIComponent(text);
    const lingvaUrl = `https://lingva.ml/api/v1/${sourceLang}/${targetLang}/${encoded}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(lingvaUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.translation) {
        setCachedTranslation(sourceLang, targetLang, text, data.translation);
        return data.translation;
      }
    }
  } catch (lingvaErr) {}

  return text;
}

// Multilingual topic keywords mapping to Athigarams / Kural topics
export const TOPIC_MAPPINGS = [
  {
    topicKey: 'god',
    athigaramNumber: 1,
    defaultKural: 1,
    keywords: ['கடவுள்', 'இறைவன்', 'ஆதிபகவன்', 'god', 'lord', 'deity', 'divine', 'भगवान', 'ईश्वर', 'परमात्मा', 'bhagwan', 'ishwar', 'భగవంతుడు', 'ഈശ്വരൻ', 'ದೇವ್ರು', 'ঈশ্বর', 'الله', 'dieu', 'dios', 'gott', 'dio', '神', '하나님']
  },
  {
    topicKey: 'faith_deen',
    athigaramNumber: 4,
    defaultKural: 31,
    keywords: ['தீன்நெறி', 'deen', 'faith', 'religion', 'piety', 'righteousness', 'धर्म', 'दीन', 'दीनदयाल', 'ईमान', 'إيمان', 'دين', 'glaube']
  },
  {
    topicKey: 'rain',
    athigaramNumber: 2,
    defaultKural: 11,
    keywords: ['மழை', 'வான்சிறப்பு', 'மழைநீர்', 'வானம்', 'rain', 'water', 'clouds', 'precipitation', 'बारिश', 'वर्षा', 'पानी', 'baarish', 'barish', 'paani', 'వర్షం', 'മഴ', 'ಮಳೆ', 'বৃষ্টি', 'مطر', 'pluie', 'lluvia', 'regen', 'pioggia', '雨', '비']
  },
  {
    topicKey: 'virtue',
    athigaramNumber: 4,
    defaultKural: 31,
    keywords: ['அறம்', 'அறநெறி', 'தர்மம்', 'virtue', 'righteousness', 'morality', 'dharma', 'goodness', 'धर्म', 'सत्कर्म', 'पुण्य', 'dharm', 'dharma', 'satkarm', 'ధర్మం', 'ധർമ്മം', 'ಧರ್ಮ', 'ধর্ম', 'فضيلة', 'vertu', 'virtud', 'tugend', 'virtù', '美德', '도덕']
  },
  {
    topicKey: 'family',
    athigaramNumber: 5,
    defaultKural: 45,
    keywords: ['இல்வாழ்க்கை', 'குடும்பம்', 'மனைவி', 'இல்லறம்', 'family', 'marriage', 'domestic', 'household', 'spouse', 'wife', 'परिवार', 'गृहस्थ', 'पत्नी', 'parivar', 'patni', 'குடும்பம்', 'കുടുംബം', 'ಕುಟುಂಬ', 'পরিবার', 'أسرة', 'famille', 'familia', 'familie', 'famiglia', '家庭', '가족']
  },
  {
    topicKey: 'children',
    athigaramNumber: 7,
    defaultKural: 69,
    keywords: ['மக்கட்பேறு', 'பிள்ளை', 'குழந்தை', 'மகன்', 'மகள்', 'தாய்', 'children', 'son', 'daughter', 'mother', 'parenting', 'बच्चे', 'पुत्र', 'संतान', 'माँ', 'माता', 'bachhe', 'bacche', 'maa', 'mata', 'thaye', 'తల్లి', 'పిల్లలు', 'മക്കൾ', 'ಮಕ್ಕಳು', 'সন্তান', 'أطفال', 'enfants', 'hijos', 'kinder', 'figli', '孩子', '자녀']
  },
  {
    topicKey: 'love',
    athigaramNumber: 8,
    defaultKural: 71,
    keywords: ['அன்பு', 'அன்புடைமை', 'பாசம்', 'நேசம்', 'காதல்', 'love', 'affection', 'compassion', 'care', 'प्यार', 'प्रेम', 'स्नेह', 'pyaar', 'pyar', 'prem', 'ishq', 'anbu', 'ప్రేమ', 'സ്നേഹം', 'ಪ್ರೀತಿ', 'ভালোবাসা', 'حب', 'amour', 'amor', 'liebe', 'amore', '爱', '사랑', '愛', '愛情', '恋愛', '恋']
  },
  {
    topicKey: 'hospitality',
    athigaramNumber: 9,
    defaultKural: 81,
    keywords: ['விருந்தோம்பல்', 'விருந்து', 'அதிதி', 'hospitality', 'guests', 'host', 'welcome', 'अतिथि', 'सत्कार', 'मेहमान', 'atithi', 'mehmaan', 'mehman', 'ఆతిథ్యం', 'വിരുന്നോമ്പൽ', 'ಆತಿಥ್ಯ', 'অতিথি', 'ضيافة', 'hospitalité', 'hospitalidad', 'gastfreundschaft', 'ospitalità', '好客', '환대']
  },
  {
    topicKey: 'sweet_words',
    athigaramNumber: 10,
    defaultKural: 99,
    keywords: ['இனியவை கூறல்', 'இனிமையான சொல்', 'இன்சொல்', 'pleasant words', 'kind words', 'polite speech', 'sweet speech', 'मधुर वाणी', 'मीठे बोल', 'विनम्रता', 'meethe bol', 'madhur vani', 'vinamrata', 'మధుర సంభాషణ', 'ഇൻசொல்ல்', 'ಇಂಪಾದ ಮಾತು', 'মিষ্টি কথা', 'كلام طيب', 'paroles douces', 'palabras amables', 'freundliche worte', 'parole dolci', '温和的话', '친절한 말']
  },
  {
    topicKey: 'gratitude',
    athigaramNumber: 11,
    defaultKural: 102,
    keywords: ['செய்ந்நன்றி', 'நன்றி', 'நன்றியறிதல்', 'உதவி', 'gratitude', 'thankfulness', 'appreciation', 'grateful', 'favour', 'help', 'कृतज्ञता', 'आभार', 'धन्यवाद', 'उपकार', 'aabhar', 'dhanyawad', 'upkaar', 'కృతజ్ఞత', 'നന്ദി', 'ಕೃತಜ್ಞತೆ', 'কৃতজ্ঞতা', 'شكر', 'gratitude', 'gratitud', 'dankbarkeit', 'gratitudine', '感恩', '감사']
  },
  {
    topicKey: 'self_control',
    athigaramNumber: 13,
    defaultKural: 126,
    keywords: ['அடக்கம்', 'அடக்கமுடைமை', 'கட்டுப்பாடு', 'நா காக்க', 'self control', 'restraint', 'discipline', 'tongue', 'संयम', 'आत्मनियंत्रण', 'जीभ', 'sanyam', 'jeebh', 'aadakkam', 'ఆత్మనిగ్రహం', 'അടക്കം', 'ಸ್ವಯಂ ನಿಯಂತ್ರಣ', 'সংযম', 'ضبط النفس', 'maîtrise de soi', 'autocontrol', 'selbstbeherrschung', 'autocontrollo', '自律', '자제력']
  },
  {
    topicKey: 'patience',
    athigaramNumber: 16,
    defaultKural: 151,
    keywords: ['பொறை', 'பொறையுடைமை', 'பொறுமை', 'மன்னிப்பு', 'forgiveness', 'patience', 'tolerance', 'endurance', 'क्षमा', 'धैर्य', 'सहनशीलता', 'माफ़ी', 'dhairya', 'maafi', 'sahansheelta', 'porumai', 'mannippu', 'సహనం', 'ఓర్పు', 'ക്ഷമ', 'ತಾಳ್ಮೆ', 'صبر', 'patience', 'paciencia', 'geduld', 'pazienza', '忍耐', '인내']
  },
  {
    topicKey: 'envy',
    athigaramNumber: 17,
    defaultKural: 165,
    keywords: ['அழுக்காறு', 'அழுக்காறாமை', 'பொறாமை', 'envy', 'jealousy', 'grudge', 'ईर्ष्या', 'डाह', 'जलन', 'irshya', 'jalan', 'poramai', 'అసూయ', 'അസൂയ', 'ಅಸೂಯೆ', 'ঈর্ষা', 'حسد', 'jalousie', 'envidia', 'neid', 'gelosia', '嫉妒', '질투']
  },
  {
    topicKey: 'charity',
    athigaramNumber: 23,
    defaultKural: 221,
    keywords: ['ஈகை', 'தானம்', 'தர்மம்', 'கொடை', 'charity', 'giving', 'alms', 'दान', 'दीन दुखी', 'मदद', 'deen dukhi', 'daan', 'danam', 'ஈகை', 'தானம்', 'عطاء', 'charité', 'caridad']
  },
  {
    topicKey: 'truth',
    athigaramNumber: 30,
    defaultKural: 300,
    keywords: ['வாய்மை', 'உண்மை', 'மெய்', 'சத்தியம்', 'truth', 'truthfulness', 'honesty', 'sincerity', 'veracity', 'सत्य', 'सच्चाई', 'ईमानदारी', 'satya', 'sach', 'sachai', 'imaandari', 'vaaimai', 'unmai', 'సత్యం', 'నిజం', 'സത്യം', 'ಸತ್ಯ', 'সত্য', 'صدق', 'vérité', 'verdad', 'wahrheit', 'verità', '真实', '진실', '真実', '真理', '誠', '正直']
  },
  {
    topicKey: 'anger',
    athigaramNumber: 31,
    defaultKural: 305,
    keywords: ['வெகுளாமை', 'சினம்', 'கோபம்', 'சீற்றம்', 'anger', 'wrath', 'rage', 'furious', 'temper', 'calm', 'क्रोध', 'गुस्सा', 'कोप', 'शांति', 'krodh', 'gussa', 'kop', 'kobam', 'sinam', 'shanti', 'కోపం', 'கோபம்', 'കോപം', 'ಕೋಪ', 'রাগ', 'غضب', 'colère', 'ira', 'zorn', 'rabbia', '愤怒', '분노', '怒り', '激怒', '怒る']
  },
  {
    topicKey: 'non_violence',
    athigaramNumber: 32,
    defaultKural: 314,
    keywords: ['இன்னாசெய்யாமை', 'கொல்லாமை', 'அஹிம்சை', 'non-violence', 'non-harming', 'harm', 'peace', 'revenge', 'अहिंसा', 'शांति', 'बदला', 'ahimsa', 'shanti', 'badla', 'ஹிம்சை', 'ശാന്തി', 'ಅಹಿಂಸೆ', 'অহিংসা', 'سلام', 'non-violence', 'no violencia', 'gewaltlosigkeit', 'non violenza', '和平', '비폭력']
  },
  {
    topicKey: 'education',
    athigaramNumber: 40,
    defaultKural: 391,
    keywords: ['கல்வி', 'படிப்பு', 'கற்றல்', 'நூல்', 'education', 'learning', 'knowledge', 'study', 'school', 'books', 'शिक्षा', 'विद्या', 'ज्ञान', 'पढ़ाई', 'shiksha', 'vidya', 'gyan', 'padhai', 'kalvi', 'padippu', 'చదువు', 'విద్య', 'വിദ്യാഭ്യാസം', 'ಶಿಕ್ಷಣ', 'শিক্ষা', 'تعليم', 'éducation', 'educación', 'bildung', 'istruzione', '教育', '교육']
  },
  {
    topicKey: 'wisdom',
    athigaramNumber: 43,
    defaultKural: 421,
    keywords: ['அறிவு', 'அறிவுடைமை', 'புத்தி', 'ஞானம்', 'wisdom', 'intellect', 'intelligence', 'discernment', 'buddhi', 'बुद्धि', 'विवेक', 'समझ', 'buddhi', 'vivek', 'samajh', 'arivu', 'gnanam', 'జ్ఞానం', 'ബുദ്ധി', 'ജ്ഞാനം', 'ಬುದ್ಧಿ', 'জ্ঞান', 'حكمة', 'sagesse', 'sabiduría', 'weisheit', 'saggezza', '智慧', '지혜']
  },
  {
    topicKey: 'time',
    athigaramNumber: 49,
    defaultKural: 484,
    keywords: ['காலம்', 'காலமறிதல்', 'நேரம்', 'தருணம்', 'time', 'timing', 'opportunity', 'season', 'समय', 'अवसर', 'मुहूर्त', 'samay', 'avsar', 'kaalam', 'neram', 'సమయం', 'காலம்', 'സമയം', 'ಸಮಯ', 'সময়', 'وقت', 'temps', 'tiempo', 'zeit', 'tempo', '时机', '시간']
  },
  {
    topicKey: 'effort',
    athigaramNumber: 62,
    defaultKural: 619,
    keywords: ['ஆள்வினை', 'முயற்சி', 'உழைப்பு', 'விடாமுயற்சி', 'hard work', 'effort', 'perseverance', 'industry', 'labor', 'diligent', 'परिश्रम', 'मेहनत', 'प्रयास', 'उद्यम', 'parishram', 'mehnat', 'prayas', 'koshish', 'muyarchi', 'uzhaippu', 'కృషి', 'ಶ್ರಮ', 'പരിശ്രമം', 'পরিশ্রম', 'جهد', 'effort', 'esfuerzo', 'fleiß', 'sforzo', '努力', '노력']
  },
  {
    topicKey: 'adversity',
    athigaramNumber: 63,
    defaultKural: 621,
    keywords: ['இடுக்கண்', 'துன்பம்', 'சங்கடம்', 'துயர்', 'adversity', 'trouble', 'grief', 'crisis', 'obstacle', 'depression', 'मुसीबत', 'संकट', 'दुःख', 'कष्ट', 'musibat', 'sankat', 'dukh', 'kasht', 'thunbam', 'sangadam', 'విపత్తు', 'బాధ', 'കഷ്ടപ്പാട്', 'ಸಂಕಷ್ಟ', 'বিপদ', 'محنة', 'adversité', 'adversidad', 'unglück', 'avversità', '逆境', '고난']
  },
  {
    topicKey: 'speech',
    athigaramNumber: 65,
    defaultKural: 641,
    keywords: ['சொல்வன்மை', 'பேச்சுத்திறன்', 'சொல்', 'eloquence', 'speech', 'words', 'communication', 'oratory', 'वाणी', 'भाषण', 'वाकपटुता', 'vani', 'bhashan', 'sol', 'பேச்சு', 'భాషణం', 'സംസാരം', 'ಮಾತುಗಾರಿಕೆ', 'বক্তৃতা', 'فصاحة', 'éloquence', 'elocuencia', 'beredsamkeit', 'eloquenza', '雄辩', '웅변']
  },
  {
    topicKey: 'wealth',
    athigaramNumber: 76,
    defaultKural: 754,
    keywords: ['பொருள்', 'பொருள்செயல்வகை', 'செல்வம்', 'பணம்', 'wealth', 'money', 'prosperity', 'riches', 'finance', 'धन', 'संपत्ति', 'दौलत', 'पैसे', 'dhan', 'sampatti', 'daulat', 'paise', 'selvam', 'panam', 'porul', 'సంపద', 'డబ్బు', 'ധനം', 'ಹಣ', 'টাকা', 'ثروة', 'richesse', 'riqueza', 'reichtum', 'ricchezza', '财富', '부']
  },
  {
    topicKey: 'friendship',
    athigaramNumber: 79,
    defaultKural: 788,
    keywords: ['நட்பு', 'தோழமை', 'நண்பன்', 'சிநேகம்', 'friendship', 'friend', 'companion', 'alliance', 'मित्रता', 'दोस्ती', 'मित्र', 'सखा', 'yaar', 'dost', 'dosti', 'mitr', 'mitrata', 'natpu', 'thozhan', 'சினேகிதன்', 'స్నేహం', 'మిత్రుడు', 'സൗഹൃദം', 'ಸ್ನೇಹಿತ', 'বন্ধুত্ব', 'صداقة', 'amitié', 'amistad', 'freundschaft', 'amicizia', '友谊', '우정']
  },
  {
    topicKey: 'health',
    athigaramNumber: 95,
    defaultKural: 942,
    keywords: ['மருந்து', 'மருத்துவம்', 'உடல்நலம்', 'உணவு', 'நோய்', 'health', 'medicine', 'diet', 'healing', 'doctor', 'body', 'दवा', 'स्वास्थ्य', 'भोजन', 'इलाज', 'dawa', 'swasthya', 'bhojan', 'ilaaj', 'marunthu', 'udal nalam', 'ஆரோக்கியம்', 'వైద్యం', 'ആരോഗ്യം', 'ಆರೋಗ್ಯ', 'স্বাস্থ্য', 'صحة', 'santé', 'salud', 'gesundheit', 'salute', '健康', '건강']
  },
  {
    topicKey: 'honor',
    athigaramNumber: 97,
    defaultKural: 965,
    keywords: ['மானம்', 'தன்மானம்', 'சுயமரியாதை', 'வீரம்', 'honor', 'self respect', 'dignity', 'prestige', 'pride', 'स्वाभिमान', 'आत्मसम्मान', 'मर्यादा', 'swabhimaan', 'aatm samman', 'maanam', 'thammaanam', 'గౌరవం', 'అభిమానం', 'മാന്യത', 'ಗೌರವ', 'সম্মান', 'كرامة', 'honneur', 'honor', 'ehre', 'onore', '尊严', '명예']
  },
  {
    topicKey: 'culture',
    athigaramNumber: 100,
    defaultKural: 997,
    keywords: ['பண்பு', 'பண்புடைமை', 'நாகரிகம்', 'ஒழுங்கு', 'culture', 'courtesy', 'good manners', 'etiquette', 'civility', 'संस्कार', 'सभ्यता', 'शिष्टाचार', 'sanskar', 'sabhyata', 'shishtachar', 'panbu', 'naagarigam', 'సంస్కారం', 'మర്യാద', 'ಸಂಸ್ಕಾರ', 'সংস্কৃতি', 'أدب', 'courtoisie', 'cortesía', 'anstand', 'cortesia', '修养', '예절']
  },
  {
    topicKey: 'farming',
    athigaramNumber: 104,
    defaultKural: 1031,
    keywords: ['உழவு', 'உழவன்', 'விவசாயம்', 'விவசாயி', 'agriculture', 'farming', 'farmer', 'food producer', 'earth', 'किसान', 'खेती', 'कृषि', 'kisan', 'kheti', 'krishi', 'uzhavu', 'uzhavan', 'vivasayi', 'అన్నదాత', 'రైతు', 'കർഷകൻ', 'ಕೃಷಿ', 'কৃষি', 'زراعة', 'agriculture', 'agricultura', 'landwirtschaft', 'agricoltura', '农业', '농업']
  }
];

// Find matching topic from query
export function findTopicFromQuery(query) {
  if (!query) return null;
  const q = query.toLowerCase().trim();
  
  for (const topic of TOPIC_MAPPINGS) {
    for (const kw of topic.keywords) {
      const lkw = kw.toLowerCase().trim();
      if (!lkw) continue;
      
      // Exact match
      if (q === lkw) return topic;

      // CJK / Japanese / Chinese / Korean match (handles 1 or 2 character words like 愛, 友, 神, 雨, 怒り, 友情, 努力)
      if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/.test(lkw)) {
        if (q === lkw || q.includes(lkw)) {
          return topic;
        }
      }

      // Indic script match (Tamil, Devanagari, Telugu, Malayalam, etc.)
      else if (/[\u0B80-\u0BFF\u0900-\u097F\u0C00-\u0C7F\u0D00-\u0D7F\u0C80-\u0CFF\u0980-\u09FF\u0600-\u06FF]/.test(lkw)) {
        if (lkw.length >= 2 && (q === lkw || q.includes(lkw))) {
          return topic;
        }
      } else {
        // Latin / English whole word regex match: \bkw\b
        if (lkw.length >= 3) {
          const escaped = lkw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(?:^|\\b)${escaped}(?:\\b|$)`, 'i');
          if (regex.test(q)) {
            return topic;
          }
        }
      }
    }
  }
  return null;
}

// ---------------------------------------------------------
// Comprehensive Situational & Story Archetypes Engine
// Maps human real-life dilemmas, emotions, and moral conflicts to exact Thirukural guidance
// ---------------------------------------------------------
export const SITUATIONAL_ARCHETYPES = [
  {
    id: 'betrayal_ingratitude',
    kuralNumber: 110,
    titleTamil: 'செய்ந்நன்றி கொன்ற துரோகம்',
    titleEnglish: 'Betrayal of Trust & Ingratitude',
    patterns: [
      /\b(?:betray|betrayed|backstab|cheated me|friend cheated|took my money|disloyal|unfaithful|turned against me|ingratitude|ungrateful)\b/i,
      /துரோகம்|நண்பன் துரோகம்|ஏமாற்றி|ஏமாத்தி|செய்ந்நன்றி|நன்றி மறந்த|முதுகில் குத்தி/,
      /धोखा|धोखा दिया|दोस्त ने धोखा|गद्दारी|विश्वासघात|अहसान फरामोश|पीठ में छुरा/,
      /裏切|裏切られた|騙された|恩を仇で|背信|不誠実/
    ],
    counsel: {
      en: "Do not let their betrayal poison your noble nature. Ancient wisdom reminds us that nature itself has decreed no redemption exists for those who murder gratitude. Their wrongdoing will face its own natural consequence; protect your peace of mind and do not lose faith in goodness.",
      ta: "அன்பரே, ஒருவர் செய்த துரோகத்தால் உமது நல்லெண்ணத்தை வீணாக்காதீர்கள். செய்ந்நன்றி கொன்றவனுக்கு இவ்வுலகிலும் இயற்கை நியதியிலும் மன்னிப்பே கிடையாது. அவர்களின் தீச்செயல் அவர்களையே அழிக்கும்; நீர் நற்செயலில் உறுதியாய் இருங்கள்."
    }
  },
  {
    id: 'adversity_depression',
    kuralNumber: 621,
    titleTamil: 'துன்பம் & மனச்சோர்வு',
    titleEnglish: 'Facing Hard Times & Grief with Courage',
    patterns: [
      /\b(?:hard times|worst phase|feel depressed|depressed|hopeless|life is difficult|going through a lot|crisis|grief|calamity|struggling in life|crying everyday)\b/i,
      /துன்பம்|கஷ்டம்|மனச்சோர்வு|வாழ்க்கை கஷ்டம்|அழுகை|துயரம்|மனசு சரியில்லை|என்ன செய்வது என்று தெரியவில்லை/,
      /बुरा वक्त|संकट|मुसीबत|उदास|निराश|रोना आ रहा है|दुःख|कष्ट|डिप्रेशन/,
      /辛い|苦しい|絶望|落ち込んで|悲しい|困難|生きるのが大変/
    ],
    counsel: {
      en: "When suffering and misfortune surround you, stand tall and greet them with an unyielding, brave smile. Nothing on earth has the power to vanquish calamity like a calm, unbroken spirit.",
      ta: "அன்பரே, துன்பங்கள் சூழ்ந்திருக்கும் வேளையில் மனந்தளராமல் புன்னகையோடு நில்லுங்கள். சவால்களை கண்டு புன்னகைக்கும் உள்ளத்தின் ஆற்றலுக்கு முன்னால் எந்தத் துன்பமும் நெடுநாள் நிற்க முடியாது."
    }
  },
  {
    id: 'effort_failure',
    kuralNumber: 619,
    titleTamil: 'தோல்வியும் விடாமுயற்சியும்',
    titleEnglish: 'Failure Despite Hard Work & Destiny',
    patterns: [
      /\b(?:failed exam|failed my test|business failed|worked hard but failed|bad luck|destiny against me|fate|lost motivation|effort in vain)\b/i,
      /தோற்றுவிட்டேன்|தோல்வி|தேர்வில் தோல்வி|உழைத்தும் வெற்றி இல்லை|விதி|கடுமையாக உழைத்தேன்/,
      /फेल हो गया|परीक्षा में फेल|व्यापार में घाटा|किस्मत खराब|मेहनत बेकार|हार गया/,
      /試験に落ちた|失敗した|努力したのに|運が悪い|挫折/
    ],
    counsel: {
      en: "Do not surrender to defeat or curse your fate. Even when destiny seems unyielding, the tireless bodily toil of a human being never goes unrewarded. Stand up, learn from this setback, and strive again—true effort will eventually conquer destiny itself.",
      ta: "அன்பரே, விதியை நொந்து முடங்காதீர்கள். மனித முயற்சியின் உழைப்பு ஒருபோதும் வீண்போவதில்லை; மீண்டும் ஊக்கத்துடன் எழுந்து உழையுங்கள், வெற்றி உமது காலடியில் வந்து சேரும்."
    }
  },
  {
    id: 'revenge_insult',
    kuralNumber: 314,
    titleTamil: 'அவமானமும் பழிவாங்கலும்',
    titleEnglish: 'Overcoming Humiliation & Forgoing Revenge',
    patterns: [
      /\b(?:insulted me|humiliated me|want revenge|hurt them back|teach them a lesson|enemy attacked|toxic person)\b/i,
      /அவமானம்|அவமானப்படுத்தி|பழிவாங்க|பழி தீர்க்க|எதிரி|காயம் படுத்தி/,
      /अपमान|बदला लेना|सबक सिखाना|नीचा दिखाया|शत्रु|बदला/,
      /侮辱された|復讐したい|仕返し|見下された|敵/
    ],
    counsel: {
      en: "Seeking revenge only traps you in the same darkness as your offender. The highest, most devastating victory over those who wrong you is to return unblemished good, putting their conscience to shame.",
      ta: "அன்பரே, பழிக்குப்பழி என்பது உமது தூய உள்ளத்தையும் பாழாக்கும். தீமை செய்தவர் தலைகுனிந்து வெட்கி நிற்கும் வண்ணம் அவர்களுக்கு நன்மையே செய்யுங்கள்; அதுவே அறிவார்ந்த மாபெரும் பெருந்தன்மை."
    }
  },
  {
    id: 'harsh_speech',
    kuralNumber: 129,
    titleTamil: 'கடுஞ்சொற்களால் மனக்காயம்',
    titleEnglish: 'Wounds Caused by Cruel Words',
    patterns: [
      /\b(?:said cruel words|hurtful words|words broke my heart|verbal abuse|spoke harshly|insulting words|spoken wound)\b/i,
      /கடுமையான சொல்|கொடுஞ்சொல்|பேசிய வார்த்தை|சொல்லால் காயம்|நாக்கு|வார்த்தையால் காயப்பட்டு/,
      /कड़वे बोल|चुभने वाली बात|बातों से दिल दुखा|गाली दी|बोली का घाव/,
      /暴言|言葉で傷ついた|心ない言葉|きつい言葉/
    ],
    counsel: {
      en: "A burn caused by fire heals from within, but words spoken in malice leave a deep emotional scar. Do not hold onto the cruel words thrown at you, and guard your own tongue so you never inflict such a scar on anyone.",
      ta: "அன்பரே, நாவின் சொற்கள் நெருப்பை விடக் கொடியவை. பிறர் பேசிய கொடுஞ்சொல்லை உமது ஆன்மாவில் சுமந்து தவிக்காதீர்கள்; நீரும் எக்காலத்திலும் எவர் மனதையும் நோகடிக்கும் கொடிய சொற்களைப் பேசாதிருக்க நாவைக் காத்துக் கொள்ளுங்கள்."
    }
  },
  {
    id: 'anger_temper',
    kuralNumber: 305,
    titleTamil: 'சினத்தைக் கட்டுப்படுத்துதல்',
    titleEnglish: 'Mastering Sudden Anger & Rage',
    patterns: [
      /\b(?:anger issue|lose my temper|get furious|shouting|cannot control anger|temper tantrum|exploded in anger)\b/i,
      /கோபம் வருது|சினம்|கட்டுப்படுத்த முடியாத கோபம்|சீற்றம்|ஆத்திரம்/,
      /गुस्सा आता है|क्रोध|गुस्सा शांत नहीं होता|आप खो बैठता हूँ/,
      /怒りを抑えられない|カッとなる|激怒|怒りっぽい/
    ],
    counsel: {
      en: "Anger is an internal fire that consumes its own bearer before harming anyone else. If you wish to protect your life, health, and dignity, quench the spark of wrath the instant it flares up.",
      ta: "அன்பரே, கோபம் என்பது எதிரியை அழிப்பதற்கு முன், அதைக் கொண்டிருக்கும் உங்களையே எரித்து சாம்பலாக்கும். உங்களை நீங்கள் காப்பாற்றிக் கொள்ள விரும்பினால், சினம் எழும் நொடியிலேயே அமைதியைக் கடைப்பிடியுங்கள்."
    }
  },
  {
    id: 'laziness_procrastination',
    kuralNumber: 605,
    titleTamil: 'சோம்பலும் தள்ளிப்போடுதலும்',
    titleEnglish: 'Overcoming Procrastination & Indolence',
    patterns: [
      /\b(?:procrastinating|procrastination|lazy|delaying work|wasting time|putting off tasks|no discipline|sleep too much)\b/i,
      /சோம்பல்|தள்ளிப்போடு|வேலை செய்ய சோம்பேறி|நேரத்தை வீணடிக்கிறேன்|முடங்கி/,
      /आलस|काम टालना|समय बर्बाद|काम में मन नहीं लगता|सुस्ती/,
      /先延ばし|やる気が出ない|怠惰|時間を無駄に/
    ],
    counsel: {
      en: "Procrastination and indolence are the silent ruin of human potential. Time once lost never returns; awaken from inaction today, take the first step, and consistency will build your greatness.",
      ta: "அன்பரே, சோம்பல் என்பது நஞ்சை விடக் கொடியது; அது உங்களின் மேன்மையையே அழித்துவிடும். காலத்தை வீணடிக்காமல் உடனே செயலில் இறங்குங்கள்; சிறிய முயற்சி கூட பெரும் நற்பலனாக மாறும்."
    }
  },
  {
    id: 'true_friendship',
    kuralNumber: 788,
    titleTamil: 'உண்மையான நட்பு யார்?',
    titleEnglish: 'Recognizing Genuine Friendship in Distress',
    patterns: [
      /\b(?:true friend|who is a real friend|fake friends|friend left me|lost friend|meaning of friendship|good companion)\b/i,
      /உண்மையான நண்பன்|போலி நண்பர்கள்|நட்பின் அடையாளம்|தோழன் விலகிவிட்டான்/,
      /सच्चा दोस्त|मतलबी दोस्त|सच्ची मित्रता|दोस्ती क्या है/,
      /本当の友人|偽の友達|友情とは|親友/
    ],
    counsel: {
      en: "A real friend does not wait to be asked; just as your hand instinctively rushes to catch slipping garments, a true companion leaps to alleviate your suffering the moment it appears.",
      ta: "அன்பரே, ஆடை நழுவும் போது கை எவ்வாறு யோசிக்காமல் உடனே சென்று காக்கிறதோ, அதுபோல உமது துன்பத்தைக் கண்ட மாத்திரத்தில் ஓடிவந்து உதவும் ஒருவரே உண்மையான நண்பர். சுகத்தில் மட்டும் உடன் இருப்பவர்கள் வழிப்போக்கர்களே."
    }
  },
  {
    id: 'unappreciated_kindness',
    kuralNumber: 211,
    titleTamil: 'கைம்மாறு கருதாத நற்செயல்',
    titleEnglish: 'Selfless Benevolence Without Expecting Praise',
    patterns: [
      /helped.*(?:no thanks|thank you|didn't thank|not.*thank|appreciat|never said|ungrateful)|taken for granted|unappreciated|did so much good/i,
      /உதவி செய்தேன்.*நன்றி|நன்றி சொல்லவில்லை|யாரும் பாராட்டவில்லை|நன்மை செய்தும் பயன் இல்லை|ஏமாற்றமாக இருக்கிறது/,
      /मदद की कोई कद्र नहीं|शुक्रिया नहीं कहा|धन्यवाद नहीं कहा|सबके लिए किया फिर भी/,
      /感謝されない|ありがとうも言われない|恩を仇|尽くしたのに報われない/
    ],
    counsel: {
      en: "The rain clouds pour life upon the thirsty earth without expecting a single token in return. Performing goodness is your soul's noble duty; do not allow the absence of praise to dim your compassionate heart.",
      ta: "அன்பரே, மழை இவ்வுலகத்திற்கு நீரைத் தரும் போது யாரிடமும் கைம்மாறு எதிர்பார்ப்பதில்லை. நற்செயல் செய்வதே உயரிய இன்பம்; பிறர் நன்றி கூறவில்லை என்பதற்காக உமது தூய கொடைத் தன்மையை மாற்றிக் கொள்ளாதீர்கள்."
    }
  },
  {
    id: 'decision_new_venture',
    kuralNumber: 467,
    titleTamil: 'புதிய முயற்சி & திட்டமிடுதல்',
    titleEnglish: 'Planning Thoroughly Before Taking the Leap',
    patterns: [
      /\b(?:start new business|taking a big risk|new career|should i do it|fear of starting|planning a venture|confused what to do)\b/i,
      /புதிய தொழில்|தொடங்க பயம்|முயற்சி எடுக்கலாமா|திட்டமிடல்|முடிவு எடுக்க முடியவில்லை/,
      /नया काम शुरू|नया व्यापार|शुरू करने में डर|क्या करूं फैसला/,
      /新しい挑戦|起業|始めるのが怖い|決断/
    ],
    counsel: {
      en: "Weigh every consequence, risk, and resource deeply before taking action; to act blindly and then say 'we will ponder later' is ruinous. But once you resolve with clear planning, proceed without doubt.",
      ta: "அன்பரே, செயலில் இறங்குவதற்கு முன் அனைத்து நன்மைகள், தீமைகள், மற்றும் அபாயங்களை ஆழமாக ஆராய்ந்து திட்டமிடுங்கள். ஆனால் தெளிவான திட்டத்துடன் முடிவெடுத்து இறங்கிய பின் ஒருபோதும் தயங்கக் கூடாது."
    }
  },
  {
    id: 'jealousy_comparison',
    kuralNumber: 167,
    titleTamil: 'பொறாமையை நீக்குதல்',
    titleEnglish: 'Overcoming Envy & Comparison with Others',
    patterns: [
      /\b(?:feel jealous|comparing myself to others|people jealous of me|envy others success|inferiority)\b/i,
      /பொறாமை|மற்றவரைப் பார்த்து ஏக்கம்|அழுக்காறு|என்னை பார்த்து பொறாமை/,
      /जलन हो रही है|ईर्ष्या|दूसरों से तुलना|उसकी तरक्की देखकर जलना/,
      /嫉妬してしまう|他人と比べる|羨ましい/
    ],
    counsel: {
      en: "Envy damages the heart of the one who feels it far more than the person envied. Rejoice in the fortune of others, focus entirely on your own labor, and genuine prosperity will follow.",
      ta: "அன்பரே, பொறாமை என்பது பிறரை விட உங்களையே அதிகம் காயப்படுத்தும். பிறர் உயர்வை வாழ்த்தப் பழகுங்கள்; உமது உழைப்பில் மட்டுமே கவனம் செலுத்துங்கள், நல்வாழ்வு உங்களைத் தேடி வரும்."
    }
  },
  {
    id: 'white_lie_dilemma',
    kuralNumber: 292,
    titleTamil: 'உயிர்காக்கும் பொய் தவறுதானா?',
    titleEnglish: 'The Dilemma of Truth vs Harm',
    patterns: [
      /\b(?:told a lie to save someone|white lie|guilty of lying|save an innocent life|lie for good)\b/i,
      /உயிரைக் காப்பாற்ற பொய்|பொய் சொல்லிவிட்டேன் குற்ற உணர்வு|நன்மைக்காக பொய்/,
      /जान बचाने के लिए झूठ|भलाई के लिए झूठ बोला|झूठ का अपराधबोध/,
      /嘘をついた罪悪感|人を助けるための嘘/
    ],
    counsel: {
      en: "Even an untruth partakes of the sacred purity of truth, if its sole result is unblemished protection of the innocent without malice. Release your guilt and walk steadfastly in virtue.",
      ta: "அன்பரே, எவ்வித தீங்கும் இன்றி, ஒரு அப்பாவியைக் காப்பாற்றவோ அல்லது மாபெரும் நன்மையையோ விளைவிக்கும் பொய், வாய்மையின் புனிதத் தன்மையைப் பெறுகிறது. குற்ற உணர்வை விட்டு நன்னெறியில் நிலைத்திருங்கள்."
    }
  },
  {
    id: 'parenting_children',
    kuralNumber: 69,
    titleTamil: 'பிள்ளைகளை நல்வழிப்படுத்துதல்',
    titleEnglish: 'Guiding Children & Fostering Character',
    patterns: [
      /\b(?:child not listening|parenting problem|kids disobey|raising a son|raising a daughter|future of children)\b/i,
      /பிள்ளை கேட்க மாட்டேங்கிறான்|பிள்ளைகள் வளர்ப்பு|மகன்|மகள்|பெற்றோர் கடமை/,
      /बच्चे बात नहीं मानते|बच्चों की परवरिश|संतान की चिंता/,
      /子育ての悩み|子供が言うことを聞かない/
    ],
    counsel: {
      en: "A parent's supreme treasure is not accumulating gold for their offspring, but guiding them with wisdom and virtue so that the world honors them as exemplary souls.",
      ta: "அன்பரே, செல்வத்தை சேர்த்து வைப்பதை விட, பிள்ளைகளுக்கு நற்குணங்களையும் கல்வியையும் கற்றுத் தருவதே பெற்றோரின் தலையாய கடமை. சான்றோனாக அவர்களை வளர்த்தெடுப்பதே மாபெரும் செல்வம்."
    }
  },
  {
    id: 'greed_shortcuts',
    kuralNumber: 177,
    titleTamil: 'பேராசையால் இழப்பு',
    titleEnglish: 'Greed, Shortcuts & Seeking Unearned Wealth',
    patterns: [
      /\b(?:lost money in gambling|greed for money|quick rich scheme|shortcut failed|coveted another's wealth)\b/i,
      /பேராசை|சூதாட்டம்|பண ஆசை|குறுக்கு வழி|பிறர் பொருள் மீது ஆசை/,
      /लालच में पैसे डूबे|जुआ|जल्दी अमीर बनने के चक्कर में/,
      /ギャンブルで負けた|欲張って失敗した|金銭欲/
    ],
    counsel: {
      en: "Wealth gained through greed and dishonest shortcuts carries only ruin in its wake. Peaceful contentment born of honest, righteous labor is the only wealth that stays and blesses.",
      ta: "அன்பரே, பேராசையாலும் குறுக்குவழியாலும் வரும் செல்வம் இறுதியில் அழிவைத் தரும். நேர்மையான உழைப்பால் வரும் மனநிறைவே நிலையான செல்வம்; நல்வழியில் நடைபோடுங்கள்."
    }
  },
  {
    id: 'loneliness_isolation',
    kuralNumber: 72,
    titleTamil: 'தனிமையும் அன்பின் தேவையும்',
    titleEnglish: 'Overcoming Loneliness & Lack of Affection',
    patterns: [
      /\b(?:feel so lonely|nobody cares for me|isolated|no love in my life|abandoned by everyone|alone in the world)\b/i,
      /தனிமை|யாரும் இல்லை|பாசம் கிடைக்கவில்லை|தனிமையில் அழுகிறேன்|ஆதரவு இல்லை/,
      /अकेलापन|कोई प्यार नहीं करता|अकेला महसूस कर रहा हूँ|बेसहारा/,
      /孤独|誰も愛してくれない|一人ぼっち/
    ],
    counsel: {
      en: "Instead of waiting for affection to knock on your door, turn outward and offer genuine compassion to the world around you. A heart that generously gives love is never truly isolated.",
      ta: "அன்பரே, பிறர் அன்பைத் தேடி ஏங்குவதை விட, பிறரிடம் அன்பு காட்டத் தொடங்குங்கள். அன்பு செலுத்தும் ஒரு உள்ளம் ஒருபோதும் தனிமையில் இருக்காது; உலகமே அவனுக்கு உறவாகும்."
    }
  },
  {
    id: 'handling_arrogance',
    kuralNumber: 125,
    titleTamil: 'ஆணவத்தை எதிர்கொள்ளுதல்',
    titleEnglish: 'Dignity & Humility Against Arrogance',
    patterns: [
      /\b(?:arrogant boss|boss looks down on me|dealing with proud person|egoistic colleague|superiority complex)\b/i,
      /ஆணவம்|அகந்தை பிடித்தவன்|என்னை மதிக்கவில்லை|கர்வம்/,
      /अहंकारी बॉस|घमंडी लोग|नीचा दिखाते हैं|अहंकार/,
      /傲慢な上司|見下してくる人|プライドが高い人/
    ],
    counsel: {
      en: "Do not combat arrogance with furious indignation. Quiet dignity and refined humility are an impenetrable armor that will outlast all boastful pride.",
      ta: "அன்பரே, ஆணவம் கொண்டவர்களின் அறியாமையைக் கண்டு கோபம் கொள்ளாதீர்கள். உங்கள் பணிவும் அமைதியுமே அவர்களின் அகந்தைக்கு முன்னால் உங்களை கம்பீரமாக நிலைநிறுத்தும்."
    }
  }
];

// ---------------------------------------------------------
// Detect and Analyze Situations & Stories in User Queries
// ---------------------------------------------------------
export function detectAndAnalyzeSituation(query) {
  if (!query || typeof query !== 'string') return null;
  const q = query.trim().toLowerCase();

  // 1. Check against predefined real-life situation archetypes
  for (const arc of SITUATIONAL_ARCHETYPES) {
    for (const pat of arc.patterns) {
      if (pat.test(q)) {
        return {
          isSituation: true,
          archetypeId: arc.id,
          kuralNumber: arc.kuralNumber,
          titleTamil: arc.titleTamil,
          titleEnglish: arc.titleEnglish,
          counselTamil: arc.counsel.ta,
          counselEnglish: arc.counsel.en
        };
      }
    }
  }

  // 2. Check general narrative / story markers
  const isNarrative = (
    /\b(situation|story|happened|my life|i feel|what should i do|give me advice|i am facing|i went through|can you guide me|dilemma|problem)\b/i.test(q) ||
    /சூழ்நிலை|கதை|வாழ்க்கை|எனக்கு நேர்ந்த|நடந்தது|என்ன செய்வது|அறிவுரை|நிலைமை/i.test(q) ||
    /कहानी|स्थिति|मेरे साथ|क्या करूं|सलाह|समस्या/i.test(q) ||
    /状況|ストーリー|どうすれば|アドバイス|悩み|相談/i.test(q) ||
    (q.split(/\s+/).length >= 5 && /\b(i|my|me|was|we|am|he|she|they)\b/i.test(q))
  );

  if (isNarrative) {
    return {
      isSituation: true,
      archetypeId: 'custom_story',
      kuralNumber: null, // to be resolved by semantic search across all 1330 kurals
      titleTamil: 'வாழ்வியல் சூழ்நிலைக்கான வள்ளுவர் நல்வாக்கு',
      titleEnglish: 'Sage Counsel for Your Life Situation',
      counselTamil: 'அன்பரே, நீங்கள் விவரித்த இந்த வாழ்வியல் சூழ்நிலைக்கு, திருவள்ளுவர் வாழ்வின் மெய்ஞானத்தை ஆய்ந்து அருளிய இந்த நற்குறள் உகந்த நல்வழியையும் உள்ளத்திற்கு அமைதியையும் புகட்டுகிறது.',
      counselEnglish: 'Dear seeker, for the life situation you have shared, Sage Thiruvalluvar offers this sacred couplet as an enduring beacon of wisdom and inner peace.'
    };
  }

  return null;
}



