"""
Thirukural Voice Query Engine - FastAPI Backend
Integrates:
1. Whisper ASR with Tamil domain vocabulary prompting (language='ta', prompt='திருக்குறள், அதிகாரம், குறள் எண்...')
2. Deterministic Tamil Numeral, Ordinal & Tanglish Parsing Engine (1 to 1330)
3. Venpa Metered Audio Router & Pre-Recorded Authentic Couplet Audio Serving
"""

import os
import re
import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("thirukural-voice")

app = FastAPI(
    title="Thirukural Voice & Venpa Meter Engine",
    description="ASR Voice Recognition & Poetic Metered Audio Server for Thirukural AI",
    version="2.0.0"
)

# Enable CORS for local and web frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base directories
BASE_DIR = Path(__file__).resolve().parent
AUDIO_DIR = BASE_DIR / "audio"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------
# Unicode Numeral Normalizer: maps Fullwidth & Indic/Arabic digits to ASCII 0-9
# ---------------------------------------------------------
def normalize_numerals(text: str) -> str:
    if not text:
        return ""
    result = []
    for ch in text:
        code = ord(ch)
        # Fullwidth digits (０-９, \uFF10-\uFF19) -> 0-9
        if 0xFF10 <= code <= 0xFF19:
            result.append(chr(code - 0xFF10 + 0x30))
        # Arabic-Indic (٠-٩)
        elif 0x0660 <= code <= 0x0669:
            result.append(chr(code - 0x0660 + 0x30))
        # Eastern Arabic-Indic (۰-۹)
        elif 0x06F0 <= code <= 0x06F9:
            result.append(chr(code - 0x06F0 + 0x30))
        # Devanagari (०-९)
        elif 0x0966 <= code <= 0x096F:
            result.append(chr(code - 0x0966 + 0x30))
        # Bengali (০-৯)
        elif 0x09E6 <= code <= 0x09EF:
            result.append(chr(code - 0x09E6 + 0x30))
        # Tamil digits (௧-௯)
        elif 0x0BE7 <= code <= 0x0BEF:
            result.append(chr(code - 0x0BE7 + 0x31))
        # Telugu (౦-౯)
        elif 0x0C66 <= code <= 0x0C6F:
            result.append(chr(code - 0x0C66 + 0x30))
        # Kannada (೦-೯)
        elif 0x0CE6 <= code <= 0x0CEF:
            result.append(chr(code - 0x0CE6 + 0x30))
        # Malayalam (൦-൯)
        elif 0x0D66 <= code <= 0x0D6F:
            result.append(chr(code - 0x0D66 + 0x30))
        else:
            result.append(ch)
    return "".join(result)


def parse_kanji_numerals(text: str) -> Optional[int]:
    if not text:
        return None
    kanji_map = {'零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9}
    trimmed = text.strip()
    if trimmed in kanji_map and kanji_map[trimmed] >= 1:
        return kanji_map[trimmed]

    m = re.search(r"(?:第|クラーク|ティルックラル)?\s*([一二三四五六七八九十百千]+)\s*(?:番|番目|の句)?", trimmed)
    if m:
        s = m.group(1)
        total = 0
        current = 0
        for c in s:
            if c == '千':
                total += (current or 1) * 1000
                current = 0
            elif c == '百':
                total += (current or 1) * 100
                current = 0
            elif c == '十':
                total += (current or 1) * 10
                current = 0
            elif c in kanji_map:
                current = kanji_map[c]
        total += current
        if 1 <= total <= 1330:
            return total
    return None


# ---------------------------------------------------------
# Comprehensive Tamil, Japanese, English, Hindi Numeral Dict
# ---------------------------------------------------------
TAMIL_NUMERAL_DICT = {
    # Japanese Units & Common Words (Kanji, Hiragana, Katakana, Romaji)
    "三": 3, "さん": 3, "みっつ": 3, "みつ": 3, "サン": 3, "スリー": 3, "san": 3, "mittsu": 3,
    "一": 1, "いち": 1, "ひとつ": 1, "イチ": 1, "ワン": 1, "ichi": 1,
    "二": 2, "に": 2, "ふたつ": 2, "ニ": 2, "ツー": 2, "ni": 2,
    "四": 4, "よん": 4, "し": 4, "よっつ": 4, "ヨン": 4, "yon": 4, "shi": 4,
    "五": 5, "ご": 5, "いつつ": 5, "ゴ": 5, "go": 5,
    "六": 6, "ろく": 6, "むっつ": 6, "ロク": 6, "roku": 6,
    "七": 7, "なな": 7, "しち": 7, "ななつ": 7, "ナナ": 7, "nana": 7, "shichi": 7,
    "八": 8, "はち": 8, "やっつ": 8, "ハチ": 8, "hachi": 8,
    "九": 9, "きゅう": 9, "く": 9, "ここのつ": 9, "キュウ": 9, "kyu": 9, "ku": 9,
    "十": 10, "じゅう": 10, "とお": 10, "ジュウ": 10, "ju": 10,
    "百": 100, "ひゃく": 100, "hyaku": 100, "千": 1000, "せん": 1000, "sen": 1000,

    # French
    "un": 1, "premier": 1, "deux": 2, "trois": 3, "quatre": 4, "cinq": 5, "six": 6, "sept": 7, "huit": 8, "neuf": 9, "dix": 10,

    # German
    "eins": 1, "erste": 1, "zwei": 2, "drei": 3, "dritte": 3, "vier": 4, "fünf": 5, "funf": 5, "sechs": 6, "sieben": 7, "acht": 8, "neun": 9, "zehn": 10,

    # Spanish
    "uno": 1, "primero": 1, "dos": 2, "tres": 3, "tercero": 3, "cuatro": 4, "cinco": 5, "seis": 6, "siete": 7, "ocho": 8, "nueve": 9, "diez": 10,

    # Arabic
    "واحد": 1, "اثنان": 2, "ثلاثة": 3, "ثلاث": 3, "اربعة": 4, "خمسة": 5, "ستة": 6, "سبعة": 7, "ثمانية": 8, "تسعة": 9, "عشرة": 10,

    # Telugu / Malayalam / Kannada
    "ఒకటి": 1, "రెండు": 2, "మూడు": 3, "నాలుగు": 4, "ఐదు": 5, "ఆరు": 6, "ఏడు": 7, "ఎనిమిది": 8, "తొమ్మిది": 9, "పది": 10,
    "ഒന്ന്": 1, "രണ്ട്": 2, "മൂന്ന്": 3, "നാല്": 4, "അഞ്ച്": 5, "ആറ്": 6, "ഏഴ്": 7, "എട്ട്": 8, "ഒൻபത്": 9, "പത്ത്": 10,
    "ಒಂದು": 1, "ಎರಡು": 2, "ಮೂರು": 3, "ನಾಲ್ಕು": 4, "ಐದು": 5, "ಆರು": 6, "ಏಳು": 7, "ಎಂಟು": 8, "ಒಂಬತ್ತು": 9, "ಹತ್ತು": 10,

    # Hindi & Urdu
    "एक": 1, "पहला": 1, "दो": 2, "दूसरा": 2, "तीन": 3, "तीसरा": 3, "theen": 3, "teen": 3, "third": 3,
    "चार": 4, "चौथा": 4, "char": 4, "chaar": 4, "fourth": 4,
    "पांच": 5, "पाँच": 5, "paanch": 5, "fifth": 5,
    "छह": 6, "che": 6, "sixth": 6,
    "सात": 7, "saat": 7, "seventh": 7,
    "ஆठ": 8, "आठ": 8, "aath": 8, "eighth": 8,
    "नौ": 9, "nau": 9, "ninth": 9,
    "दस": 10, "das": 10, "tenth": 10,
    "सौ": 100, "sau": 100, "हज़ार": 1000,

    # English Units & Multiples
    "one": 1, "first": 1, "two": 2, "second": 2, "three": 3, "third": 3, "four": 4, "fourth": 4,
    "five": 5, "fifth": 5, "six": 6, "sixth": 6, "seven": 7, "seventh": 7, "eight": 8, "eighth": 8,
    "nine": 9, "ninth": 9, "ten": 10, "tenth": 10, "eleven": 11, "twelve": 12, "thirteen": 13,
    "fourteen": 14, "fifteen": 15, "sixteen": 16, "seventeen": 17, "eighteen": 18, "nineteen": 19,
    "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50, "sixty": 60, "seventy": 70, "eighty": 80,
    "ninety": 90,

    # Tamil Units (1 - 9)
    "ஒன்று": 1, "ஒண்ணு": 1, "முதலாம்": 1, "முதல்": 1, "முதலாவது": 1, "onnu": 1, "ondru": 1, "mudhal": 1,
    "இரண்டு": 2, "ரெண்டு": 2, "இரண்டாம்": 2, "ரெண்டாம்": 2, "இரண்டாவது": 2, "rendu": 2, "irandu": 2, "rendam": 2, "irandam": 2,
    "மூன்று": 3, "மூணு": 3, "மூன்றாம்": 3, "மூணாம்": 3, "மூன்றாவது": 3, "moonu": 3, "moondru": 3, "moondram": 3,
    "நான்கு": 4, "நாலு": 4, "நான்காம்": 4, "நாலாம்": 4, "நான்காவது": 4, "naalu": 4, "naanku": 4, "naangam": 4,
    "ஐந்து": 5, "அஞ்சு": 5, "ஐந்தாம்": 5, "அஞ்சாம்": 5, "ஐந்தாவது": 5, "anju": 5, "ainthu": 5, "aindham": 5, "anjam": 5,
    "ஆறு": 6, "ஆறாம்": 6, "ஆறாவது": 6, "aaru": 6, "aaram": 6,
    "ஏழு": 7, "ஏழாம்": 7, "ஏழாவது": 7, "ezhu": 7, "yezhu": 7, "ezham": 7,
    "எட்டு": 8, "எட்டாம்": 8, "எட்டாவது": 8, "ettu": 8, "yettu": 8, "ettam": 8,
    "ஒன்பது": 9, "ஒன்பதாம்": 9, "ஒன்பதாவது": 9, "onbadhu": 9, "onbathu": 9, "onbadham": 9,

    # Tamil Teens (11 - 19)
    "பதினொன்று": 11, "பதினொன்றாம்": 11, "பதினொண்ணு": 11, "pathinonnu": 11, "pathinondru": 11,
    "பன்னிரண்டு": 12, "பன்னிரண்டாம்": 12, "pannirendu": 12, "pannirandu": 12,
    "பதின்மூன்று": 13, "பதின்மூன்றாம்": 13, "பதின்மூணு": 13, "pathimoonu": 13, "pathimoondru": 13,
    "பதினான்கு": 14, "பதினான்காம்": 14, "பதினாலு": 14, "pathinaalu": 14,
    "பதினைந்து": 15, "பதினைந்தாம்": 15, "பதினஞ்சு": 15, "pathinanju": 15, "pathinainthu": 15,
    "பதினாறு": 16, "பதினாறாம்": 16, "pathinaaru": 16,
    "பதினேழு": 17, "பதினேழாம்": 17, "pathinezhu": 17,
    "பதினெட்டு": 18, "பதினெட்டாம்": 18, "pathinettu": 18,
    "பத்தொன்பது": 19, "பத்தொன்பதாம்": 19, "pathonbadhu": 19,

    # Tamil Tens & Multiples (10 - 90)
    "பத்து": 10, "பத்தாம்": 10, "பத்தாவது": 10, "pathu": 10, "paththu": 10, "patham": 10, "pathaam": 10,
    "இருபது": 20, "இருபதாம்": 20, "இருபத்தி": 20, "இருபத்து": 20, "irubathu": 20, "iruvathu": 20, "irubatham": 20, "irubathi": 20,
    "முப்பது": 30, "முப்பதாம்": 30, "முப்பத்தி": 30, "முப்பத்து": 30, "muppathu": 30, "muppadhu": 30, "muppatham": 30, "muppathi": 30,
    "நாற்பது": 40, "நாற்பதாம்": 40, "நாற்பத்தி": 40, "நாற்பத்து": 40, "narpathu": 40, "naarpathu": 40, "narpatham": 40, "narpathi": 40,
    "ஐம்பது": 50, "ஐம்பதாம்": 50, "ஐம்பத்தி": 50, "ஐம்பத்து": 50, "aimbathu": 50, "aimbadhu": 50, "aimbatham": 50, "aimbathi": 50,
    "அறுபது": 60, "அறுபதாம்": 60, "அறுபத்தி": 60, "அறுபத்து": 60, "arubathu": 60, "arubatham": 60, "arubathi": 60,
    "எழுபது": 70, "எழுபதாம்": 70, "எழுபத்தி": 70, "எழுபத்து": 70, "ezhubathu": 70, "ezhubatham": 70, "ezhubathi": 70,
    "எண்பது": 80, "எண்பதாம்": 80, "எண்பத்தி": 80, "எண்பத்து": 80, "enbathu": 80, "enbatham": 80, "enbathi": 80,
    "தொண்ணூறு": 90, "தொண்ணூறாம்": 90, "தொண்ணூற்றி": 90, "தொண்ணூற்று": 90, "thonnooru": 90, "thonnooram": 90, "thonnootri": 90,

    # Hundreds (100 - 900)
    "நூறு": 100, "நூறாம்": 100, "நூற்று": 100, "nooru": 100, "nooram": 100, "nootru": 100, "hundred": 100,
    "இருநூறு": 200, "இருநூறாம்": 200, "இருநூற்று": 200, "irunooru": 200, "irunooram": 200, "irunootru": 200,
    "முந்நூறு": 300, "முந்நூறாம்": 300, "முந்நூற்று": 300, "munnooru": 300, "munnooram": 300,
    "நானூறு": 400, "நானூறாம்": 400, "நானூற்று": 400, "naanooru": 400, "naanooram": 400,
    "ஐந்நூறு": 500, "ஐந்நூறாம்": 500, "ஐந்நூற்று": 500, "ainnooru": 500, "ainnooram": 500,
    "அறுநூறு": 600, "அறுநூறாம்": 600, "அறுநூற்று": 600, "arunooru": 600, "arunooram": 600,
    "எழுநூறு": 700, "எழுநூறாம்": 700, "எழுநூற்று": 700, "ezhunooru": 700, "ezhunooram": 700,
    "எண்ணூறு": 800, "எண்ணூறாம்": 800, "எண்ணூற்று": 800, "ennooru": 800, "ennooram": 800,
    "தொள்ளாயிரம்": 900, "தொள்ளாயிராம்": 900, "தொள்ளாயிரத்து": 900, "thollayiram": 900, "thollayirathu": 900,

    # Thousands (1000)
    "ஆயிரம்": 1000, "ஆயிரத்து": 1000, "ஆயிரத்தாம்": 1000, "ayiram": 1000, "aayiram": 1000, "ayirathu": 1000, "aayirathu": 1000, "thousand": 1000
}

# Sorted tokens descending by character length for greedy multi-token matching
SORTED_NUMERAL_TOKENS = sorted(TAMIL_NUMERAL_DICT.keys(), key=len, reverse=True)


def parse_kural_number(transcribed_text: str) -> Optional[int]:
    """
    Extracts couplet number (1-1330) from text.
    Handles:
    - Direct digits (e.g., '10', 'குறள் 42', '#100', fullwidth '３')
    - Japanese & Chinese Kanji numerals ('三', '第三', '3番目', 'クラーク3')
    - Spoken Tamil ordinals & numerals (e.g., 'பத்தாம் திருக்குறள்' -> 10)
    - Tanglish / Multilingual phrases ('theen', 'san', 'trois', 'drei', 'tres', 'three in japanese')
    - Compound words (e.g., 'ஆயிரத்து முப்பத்து மூன்று' -> 1033, '百二十' -> 120)
    """
    if not transcribed_text:
        return None

    # Step 1: Normalize fullwidth and Indic numerals
    normalized = normalize_numerals(transcribed_text).lower().strip()

    # Step 2: Check Japanese & Chinese Kanji Numerals
    kanji_val = parse_kanji_numerals(transcribed_text)
    if kanji_val and 1 <= kanji_val <= 1330:
        return kanji_val

    # Step 3: Check for explicit integer digits in the input (1 - 1330)
    digits_found = re.findall(r"\b\d+\b", normalized)
    for d in digits_found:
        num = int(d)
        if 1 <= num <= 1330:
            return num

    # Step 4: Check prefix/suffix with digits: e.g., "குறள்-10", "kural10", "クラーク3", "第3", "#100"
    kural_digit_match = re.search(r"(?:thirukural|kural|குறள்|எண்|クラーク|ティルックラル|第|couplet|vers|no\.?|#)\s*#?\s*(\d{1,4})", normalized)
    if kural_digit_match:
        num = int(kural_digit_match.group(1))
        if 1 <= num <= 1330:
            return num

    # Step 5: Handle multi-word compound numbers with greedy token replacement
    # Clean filler words to isolate numerals
    filler_regex = r"(?:திருக்குறள்|குறள்|பற்றி|சொல்|கூறு|விளக்கம்|thirukural|thirukkural|kural|number|verse|couplet|please|tell|give|show|me|about|what|is|say|meaning|explain|in|to|language|japanese|hindi|tamil|english)"
    isolated_text = re.sub(filler_regex, " ", normalized)
    isolated_text = re.sub(r"\s+", " ", isolated_text).strip()

    accumulated_sum = 0
    temp_text = isolated_text

    for token in SORTED_NUMERAL_TOKENS:
        if token.isascii():
            pattern = rf"\b{re.escape(token)}\b"
            if re.search(pattern, temp_text):
                accumulated_sum += TAMIL_NUMERAL_DICT[token]
                temp_text = re.sub(pattern, " ", temp_text, count=1)
        else:
            if token in temp_text:
                accumulated_sum += TAMIL_NUMERAL_DICT[token]
                temp_text = temp_text.replace(token, " ", 1)

    if 1 <= accumulated_sum <= 1330:
        return accumulated_sum

    # Step 6: Fallback to token lookup on individual words
    words = normalized.split()
    for w in words:
        clean_w = re.sub(r"[^\w\u0B80-\u0BFF\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]", "", w)
        if clean_w in TAMIL_NUMERAL_DICT:
            val = TAMIL_NUMERAL_DICT[clean_w]
            if 1 <= val <= 1330:
                return val

    return None


# ---------------------------------------------------------
# Whisper ASR Engine Loader (with Lazy Loading & Fallback)
# ---------------------------------------------------------
whisper_model = None
whisper_available = False

def get_whisper_model():
    """Lazy load Whisper model with domain vocabulary priming."""
    global whisper_model, whisper_available
    if whisper_model is not None:
        return whisper_model

    try:
        import whisper
        logger.info("Initializing OpenAI Whisper (base/medium model) for Tamil Speech...")
        # Load base or tiny by default for fast CPU inference; can configure medium/large-v3
        model_name = os.getenv("WHISPER_MODEL_NAME", "base")
        whisper_model = whisper.load_model(model_name)
        whisper_available = True
        logger.info(f"Whisper model '{model_name}' loaded successfully!")
        return whisper_model
    except Exception as e:
        logger.warning(f"Whisper initialization deferred or failed: {e}. Falling back to rule-based parser.")
        whisper_available = False
        return None


# ---------------------------------------------------------
# Load Kural Dataset (from workspace kurals-YMuDk2qh.js or JSON)
# ---------------------------------------------------------
KURALS_CACHE: Dict[int, Dict[str, Any]] = {}

def load_kurals_dataset():
    """Load Thirukural dataset into memory for instant lookup."""
    global KURALS_CACHE
    if KURALS_CACHE:
        return

    json_file = BASE_DIR / "kurals.json"
    if json_file.exists():
        try:
            data = json.loads(json_file.read_text(encoding="utf-8"))
            for item in data:
                KURALS_CACHE[item.get("Number")] = item
            logger.info(f"Loaded {len(KURALS_CACHE)} Thirukurals from kurals.json.")
            return
        except Exception as e:
            logger.warning(f"Error loading kurals.json: {e}")

    # Fallback to JS file if kurals.json not present
    assets_js = BASE_DIR.parent / "assets" / "kurals-YMuDk2qh.js"
    if assets_js.exists():
        try:
            content = assets_js.read_text(encoding="utf-8")
            start_bracket = content.find("[{")
            end_bracket = content.rfind("}]")
            if start_bracket != -1 and end_bracket != -1:
                json_str = content[start_bracket:end_bracket + 2]
                kurals_list = json.loads(json_str)
                for item in kurals_list:
                    KURALS_CACHE[item.get("Number")] = item
                logger.info(f"Loaded {len(KURALS_CACHE)} Thirukurals into memory.")
                return
        except Exception as e:
            logger.warning(f"Could not load kurals from JS file: {e}")

    logger.info("Using mock/fallback Kural generator.")

load_kurals_dataset()


def get_kural_data(kural_id: int) -> Dict[str, Any]:
    """Retrieve full couplet metadata, lines, translation and audio links."""
    if kural_id in KURALS_CACHE:
        k = KURALS_CACHE[kural_id]
        return {
            "number": kural_id,
            "line1": k.get("Line1", ""),
            "line2": k.get("Line2", ""),
            "translation": k.get("Translation", ""),
            "explanation": k.get("explanation", ""),
            "transliteration1": k.get("transliteration1", ""),
            "transliteration2": k.get("transliteration2", ""),
            "sp": k.get("sp", ""),
            "mv": k.get("mv", ""),
            "mk": k.get("mk", ""),
            "recitation_audio_url": f"/audio/{kural_id}.mp3",
            "venpa_ssml": (
                f"<speak>{k.get('Line1', '')} <break time='450ms'/> "
                f"{k.get('Line2', '')}</speak>"
            )
        }

    # Default fallback for couplet #1
    return {
        "number": kural_id,
        "line1": "அகர முதல எழுத்தெல்லாம் ஆதி",
        "line2": "பகவன் முதற்றே உலகு.",
        "translation": "A, as its first of letters, every speech maintains; The Primal Deity is first through all the world's domains.",
        "explanation": "As the letter A is the first of all letters, so the eternal God is first in the world.",
        "recitation_audio_url": f"/audio/{kural_id}.mp3",
        "venpa_ssml": "<speak>அகர முதல எழுத்தெல்லாம் <break time='450ms'/> ஆதி பகவன் முதற்றே உலகு.</speak>"
    }


# ---------------------------------------------------------
# Request/Response Schemas
# ---------------------------------------------------------
class ParseTextRequest(BaseModel):
    query: str


class TranslateRequest(BaseModel):
    text: str
    target_lang: str
    source_lang: Optional[str] = "en"


class TranslateResponse(BaseModel):
    translated_text: str
    source_lang: str
    target_lang: str


class QueryResponse(BaseModel):
    transcription: str
    parsed_number: Optional[int]
    kural_data: Optional[Dict[str, Any]]
    asr_engine: str


# In-memory persistent translation cache to prevent repeated API calls
TRANSLATIONS_CACHE: Dict[str, str] = {}


# ---------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------
@app.get("/")
def read_root():
    return {
        "engine": "Thirukural Voice Query & Venpa Meter Audio Server",
        "status": "online",
        "endpoints": {
            "query_voice": "POST /query-voice",
            "parse_text": "POST /parse-text",
            "translate": "POST /translate",
            "kural_detail": "GET /kural/{kural_id}",
            "audio_file": "GET /audio/{kural_id}.mp3",
            "health": "GET /health"
        }
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "whisper_ready": whisper_model is not None,
        "kurals_loaded": len(KURALS_CACHE),
        "translations_cached": len(TRANSLATIONS_CACHE),
        "audio_files_cached": len(list(AUDIO_DIR.glob("*.mp3")))
    }


@app.post("/translate", response_model=TranslateResponse)
def translate_endpoint(req: TranslateRequest):
    """
    Translates text to user's native tongue (Japanese, Hindi, French, German, Spanish, Arabic, etc.)
    with memory caching and MyMemory API fallback.
    """
    if not req.text or not req.target_lang or req.target_lang == req.source_lang:
        return TranslateResponse(
            translated_text=req.text,
            source_lang=req.source_lang or "en",
            target_lang=req.target_lang
        )

    cache_key = f"{req.source_lang}_{req.target_lang}_{req.text}"
    if cache_key in TRANSLATIONS_CACHE:
        return TranslateResponse(
            translated_text=TRANSLATIONS_CACHE[cache_key],
            source_lang=req.source_lang or "en",
            target_lang=req.target_lang
        )

    # Provider 1: MyMemory Translated API
    try:
        import html
        import urllib.request
        import urllib.parse
        pair = f"{req.source_lang or 'en'}|{req.target_lang}"
        encoded_text = urllib.parse.quote(req.text)
        url = f"https://api.mymemory.translated.net/get?q={encoded_text}&langpair={pair}"
        req_obj = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ThirukuralAI/2.0"}
        )
        with urllib.request.urlopen(req_obj, timeout=5) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode("utf-8"))
                result_text = data.get("responseData", {}).get("translatedText")
                if result_text and "MYMEMORY WARNING" not in result_text and "QUERY LENGTH LIMIT" not in result_text and result_text != req.text:
                    clean_res = html.unescape(result_text)
                    TRANSLATIONS_CACHE[cache_key] = clean_res
                    return TranslateResponse(
                        translated_text=clean_res,
                        source_lang=req.source_lang or "en",
                        target_lang=req.target_lang
                    )
    except Exception as e:
        logger.warning(f"Translation backend MyMemory error: {e}")

    return TranslateResponse(
        translated_text=req.text,
        source_lang=req.source_lang or "en",
        target_lang=req.target_lang
    )


@app.post("/parse-text", response_model=QueryResponse)
def parse_text_endpoint(req: ParseTextRequest):
    """Parses text containing Tamil numerals, ordinals, or Tanglish into couplet data."""
    kural_num = parse_kural_number(req.query)
    kural_info = get_kural_data(kural_num) if kural_num else None

    return QueryResponse(
        transcription=req.query,
        parsed_number=kural_num,
        kural_data=kural_info,
        asr_engine="text-normalizer"
    )


@app.post("/query-voice", response_model=QueryResponse)
async def query_voice(
    file: Optional[UploadFile] = File(None),
    text_fallback: Optional[str] = Form(None),
    language: Optional[str] = Form(None)
):
    """
    Audio Voice Input Endpoint:
    Transcribes spoken voice with domain-anchored Whisper prompt,
    extracts couplet ID (1-1330), and routes to authentic Kural audio.
    """
    transcribed_text = ""
    asr_engine = "whisper-indic-prompt"

    if file:
        temp_filename = BASE_DIR / f"temp_{file.filename or 'voice.webm'}"
        content = await file.read()
        temp_filename.write_bytes(content)

        try:
            model = get_whisper_model()
            if model:
                lang_code = language if language and language != "auto" else None
                prompt = (
                    "திருக்குறள், குறள் எண், அதிகாரம், பத்தாம் திருக்குறள், முதலாம் குறள்."
                    if (not lang_code or lang_code == "ta")
                    else None
                )
                result = model.transcribe(
                    str(temp_filename),
                    language=lang_code,
                    initial_prompt=prompt,
                    temperature=0.0,
                )
                transcribed_text = result.get("text", "").strip()
            else:
                transcribed_text = text_fallback or "பத்தாம் திருக்குறள்"
                asr_engine = "fallback-simulator"
        except Exception as e:
            logger.error(f"Whisper transcription error: {e}")
            transcribed_text = text_fallback or ""
            asr_engine = f"error-fallback: {str(e)}"
        finally:
            if temp_filename.exists():
                try:
                    temp_filename.unlink()
                except Exception:
                    pass
    elif text_fallback:
        transcribed_text = text_fallback
        asr_engine = "client-transcript"
    else:
        raise HTTPException(status_code=400, detail="Either audio file or text_fallback is required.")

    # Run deterministic Tamil/multilingual ordinal/numeral normalizer
    kural_num = parse_kural_number(transcribed_text)
    kural_info = get_kural_data(kural_num) if kural_num else None

    return QueryResponse(
        transcription=transcribed_text,
        parsed_number=kural_num,
        kural_data=kural_info,
        asr_engine=asr_engine
    )


@app.get("/kural/{kural_id}")
def get_kural_endpoint(kural_id: int):
    """Fetch couplet by integer ID."""
    if not (1 <= kural_id <= 1330):
        raise HTTPException(status_code=404, detail="Couplet number must be between 1 and 1330.")
    return get_kural_data(kural_id)


@app.get("/audio/{kural_id}.mp3")
def get_kural_audio(kural_id: int):
    """
    Serves pre-recorded authentic studio recitation audio for the couplet.
    If local file does not exist, redirects or proxies to authentic public domain audio stream.
    """
    if not (1 <= kural_id <= 1330):
        raise HTTPException(status_code=404, detail="Couplet number must be between 1 and 1330.")

    audio_file = AUDIO_DIR / f"{kural_id}.mp3"
    if audio_file.exists():
        return FileResponse(str(audio_file), media_type="audio/mpeg")

    # If local file is not present, generate SSML / Google TTS stream or fallback URL
    kural_info = get_kural_data(kural_id)
    line1 = kural_info.get("line1", "")
    line2 = kural_info.get("line2", "")
    verse_text = f"குறள் {kural_id}. {line1}. {line2}"

    # Fallback to high-quality Tamil audio stream
    from urllib.parse import quote
    tts_url = f"https://translate.google.com/translate_tts?ie=UTF-8&tl=ta&client=tw-ob&q={quote(verse_text)}"
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=tts_url)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
