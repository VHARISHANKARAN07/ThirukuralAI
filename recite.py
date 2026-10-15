"""
Thirukkural Sacred Voice Recitation Engine (திருக்குறள் ஓலைச்சுவடி உச்சரிப்பு)
Powered by Hugging Face `thirukural-audio` dataset & Native High-Fidelity Audio Playback.

Usage:
    # 1. In Python:
    from recite import KuralReciter
    reciter = KuralReciter()
    reciter.recite(1)  # Recites Kural #1

    # 2. In Terminal:
    python recite.py 1               # Recite Kural #1
    python recite.py random          # Recite a random Kural
    python recite.py search "அன்பு"    # Search and recite
    python recite.py adhigaram 1     # Recite Chapter 1 (all 10 kurals)
    python recite.py                 # Launch Interactive Player
"""

import os
import sys
import time
import json
import random
import ctypes
import argparse
from pathlib import Path

# Ensure UTF-8 output on Windows terminals
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

DEFAULT_DATASET_PATH = r"C:\Users\User\Downloads\thirukural-audio"
BASE_DIR = Path(__file__).resolve().parent

# Check both current directory and thirukural-ai-main subfolder
CANDIDATE_DIRS = [
    BASE_DIR,
    BASE_DIR / "thirukural-ai-main",
    BASE_DIR.parent / "thirukural-ai-main"
]

def find_first_existing(relative_subpath):
    for base in CANDIDATE_DIRS:
        p = base / relative_subpath
        if p.exists():
            return p
    return BASE_DIR / relative_subpath

AUDIO_DIR = find_first_existing("audio")
BACKEND_AUDIO_DIR = find_first_existing("backend/audio")
KURALS_JSON_PATH = find_first_existing("backend/kurals.json")


class WindowsMCIPlayer:
    """Zero-dependency high-fidelity MP3 audio playback on Windows using winmm.dll."""
    def __init__(self):
        self.winmm = ctypes.windll.winmm
        self.alias = "kural_active_audio"
        self._is_open = False

    def play_file(self, file_path: Path, wait: bool = True):
        self.stop()
        abs_path = str(file_path.resolve()).replace("/", "\\")
        
        # Open mpegvideo stream
        cmd_open = f'open "{abs_path}" type mpegvideo alias {self.alias}'
        ret = self.winmm.mciSendStringW(cmd_open, None, 0, None)
        if ret != 0:
            # Fallback to general open
            cmd_open_fb = f'open "{abs_path}" alias {self.alias}'
            self.winmm.mciSendStringW(cmd_open_fb, None, 0, None)

        self._is_open = True

        # Query duration in milliseconds
        buf = ctypes.create_unicode_buffer(128)
        self.winmm.mciSendStringW(f'status {self.alias} length', buf, 128, None)
        try:
            duration_ms = int(buf.value) if buf.value else 4500
        except ValueError:
            duration_ms = 4500

        # Start playback
        self.winmm.mciSendStringW(f'play {self.alias} from 0', None, 0, None)

        if wait:
            # Visual audio progress indicator
            total_sec = duration_ms / 1000.0
            start_t = time.time()
            try:
                while time.time() - start_t < total_sec:
                    elapsed = time.time() - start_t
                    percent = min(100, int((elapsed / total_sec) * 100))
                    bar_len = 24
                    filled = int(bar_len * percent // 100)
                    bar = "━" * filled + "╸" + "─" * max(0, bar_len - filled - 1)
                    sys.stdout.write(f"\r  🔊 Reciting: [{bar}] {elapsed:.1f}s / {total_sec:.1f}s ")
                    sys.stdout.flush()
                    time.sleep(0.1)
            except KeyboardInterrupt:
                self.stop()
                print("\n  ⏹ Stopped playback.")
                return
            sys.stdout.write(f"\r  ✓ Recitation Complete! [{ '━' * 24 }] {total_sec:.1f}s       \n")
            sys.stdout.flush()
            self.stop()

    def stop(self):
        if self._is_open:
            try:
                self.winmm.mciSendStringW(f'stop {self.alias}', None, 0, None)
                self.winmm.mciSendStringW(f'close {self.alias}', None, 0, None)
            except Exception:
                pass
            self._is_open = False


class KuralReciter:
    """Thirukkural Recitation Engine with Audio Dataset & Rich Sacred Metadata."""
    
    def __init__(self, dataset_or_path=None):
        self.dataset_path = dataset_or_path or DEFAULT_DATASET_PATH
        self.dataset = None
        self.kurals_data = {}
        self.player = WindowsMCIPlayer()
        
        # Load local JSON annotations if available
        self._load_kurals_json()

        # Cache directory for audio
        self.audio_cache_dir = AUDIO_DIR
        self.audio_cache_dir.mkdir(parents=True, exist_ok=True)

    def _load_kurals_json(self):
        if KURALS_JSON_PATH.exists():
            try:
                with open(KURALS_JSON_PATH, "r", encoding="utf-8") as f:
                    items = json.load(f)
                    for item in items:
                        num = item.get("Number")
                        if num:
                            self.kurals_data[num] = item
            except Exception as e:
                print(f"Notice: kurals.json load note: {e}")

    def _ensure_dataset_loaded(self):
        if self.dataset is not None:
            return

        if isinstance(self.dataset_path, str) or isinstance(self.dataset_path, Path):
            path_str = str(self.dataset_path)
            if os.path.exists(path_str):
                try:
                    from datasets import load_from_disk, Audio
                    ds = load_from_disk(path_str)
                    # Cast audio with decode=False for blazing fast access to raw mp3 bytes
                    self.dataset = ds["train"].cast_column("audio", Audio(decode=False))
                except Exception as e:
                    print(f"⚠️ Notice: Could not load dataset from {path_str}: {e}")
                    self.dataset = None
            else:
                self.dataset = None
        else:
            # Direct Hugging Face Dataset or DatasetDict instance passed
            try:
                from datasets import Audio
                ds = self.dataset_path
                if hasattr(ds, "keys") and "train" in ds:
                    ds = ds["train"]
                self.dataset = ds.cast_column("audio", Audio(decode=False))
            except Exception as e:
                self.dataset = self.dataset_path

    def get_audio_file(self, kural_num: int) -> Path:
        """Locates or extracts the MP3 file for couplet `kural_num`."""
        # 1. Check local audio/ directory
        candidate1 = AUDIO_DIR / f"{kural_num}.mp3"
        if candidate1.exists() and candidate1.stat().st_size > 1000:
            return candidate1

        # 2. Check backend/audio/ directory
        candidate2 = BACKEND_AUDIO_DIR / f"{kural_num}.mp3"
        if candidate2.exists() and candidate2.stat().st_size > 1000:
            return candidate2

        # 3. Extract dynamically from HuggingFace dataset
        self._ensure_dataset_loaded()
        if self.dataset is not None and 1 <= kural_num <= len(self.dataset):
            row = self.dataset[kural_num - 1]
            audio_info = row.get("audio", {})
            bytes_data = audio_info.get("bytes")
            if bytes_data:
                target_file = AUDIO_DIR / f"{kural_num}.mp3"
                target_file.write_bytes(bytes_data)
                return target_file

        return None

    def get_kural_info(self, kural_num: int) -> dict:
        """Combines dataset metadata and JSON commentaries for couplet `kural_num`."""
        if not (1 <= kural_num <= 1330):
            return None

        info = {
            "Number": kural_num,
            "Line1": "",
            "Line2": "",
            "Translation": "",
            "adhigaram": "",
            "paal": "",
            "explanation": "",
            "mv": "",
            "sp": ""
        }

        # Enrich from kurals.json
        if kural_num in self.kurals_data:
            info.update(self.kurals_data[kural_num])

        # Enrich or fill from dataset
        self._ensure_dataset_loaded()
        if self.dataset is not None and kural_num <= len(self.dataset):
            row = self.dataset[kural_num - 1]
            if not info.get("adhigaram") and row.get("adhigaram"):
                info["adhigaram"] = row["adhigaram"]
            if not info.get("paal") and row.get("paal"):
                info["paal"] = row["paal"]
            if not info.get("Line1") and row.get("kural"):
                parts = row["kural"].split("\n")
                if len(parts) >= 2:
                    info["Line1"] = parts[0].strip()
                    info["Line2"] = parts[1].strip()
                else:
                    info["Line1"] = row["kural"]

        return info

    def display_kural(self, info: dict):
        """Displays sacred Thirukkural formatted in terminal."""
        k_num = info.get("Number", 0)
        paal = info.get("paal", "")
        adhigaram = info.get("adhigaram", "")
        line1 = info.get("Line1", "")
        line2 = info.get("Line2", "")
        trans = info.get("Translation", "")
        mv = info.get("mv", "")
        sp = info.get("sp", "")

        header = f"  📜 திருக்குறள் — குறள் {k_num}  "
        if paal or adhigaram:
            header += f"[{paal} • {adhigaram}]"

        border = "━" * max(65, len(header) + 4)
        print(f"\n{border}")
        print(f"{header}")
        print(f"{border}")
        print(f"  {line1}")
        print(f"  {line2}")
        print(f"─" * max(65, len(header) + 4))
        
        if trans:
            print(f"  📖 English: \"{trans}\"")
        if mv:
            print(f"  💬 மு.வ உரை: {mv}")
        elif sp:
            print(f"  💬 சாலமன் பாப்பையா: {sp}")
        print(f"{border}")

    def recite(self, kural_num: int, wait: bool = True):
        """Recites the couplet with authentic studio audio."""
        if not (1 <= kural_num <= 1330):
            print(f"❌ Error: Couplet number must be between 1 and 1330 (received {kural_num})")
            return False

        info = self.get_kural_info(kural_num)
        self.display_kural(info)

        audio_file = self.get_audio_file(kural_num)
        if not audio_file or not audio_file.exists():
            print(f"⚠️ Audio file for Kural #{kural_num} could not be found or extracted.")
            return False

        self.player.play_file(audio_file, wait=wait)
        return True

    def recite_random(self):
        """Picks and recites a random Kural from 1 to 1330."""
        rnd_num = random.randint(1, 1330)
        return self.recite(rnd_num)

    def recite_adhigaram(self, chapter_input, pause_sec: float = 1.0):
        """Recites all 10 couplets of a chapter sequentially."""
        start_id = None
        
        # Check if integer 1 to 133
        try:
            ch_num = int(chapter_input)
            if 1 <= ch_num <= 133:
                start_id = (ch_num - 1) * 10 + 1
        except ValueError:
            pass

        # Check if chapter name in Tamil
        if start_id is None:
            self._ensure_dataset_loaded()
            if self.dataset:
                query = str(chapter_input).strip()
                for idx, row in enumerate(self.dataset):
                    if query in row.get("adhigaram", ""):
                        start_id = (idx // 10) * 10 + 1
                        break

        if start_id is None:
            print(f"❌ Chapter '{chapter_input}' not found. Please provide chapter 1-133 or Tamil name.")
            return

        end_id = start_id + 9
        print(f"\n🕊️ Reciting Chapter from Kural #{start_id} to #{end_id}...")
        for k_id in range(start_id, end_id + 1):
            self.recite(k_id, wait=True)
            if k_id < end_id:
                time.sleep(pause_sec)

    def search_and_recite(self, query: str):
        """Searches Kurals matching keyword and recites the match."""
        query = query.strip()
        print(f"\n🔍 Searching for '{query}'...")
        matches = []
        
        # Search in kurals_data
        for num, k in self.kurals_data.items():
            text = f"{k.get('Line1', '')} {k.get('Line2', '')} {k.get('Translation', '')} {k.get('explanation', '')}"
            if query.lower() in text.lower():
                matches.append(num)

        # Fallback search in dataset
        if not matches:
            self._ensure_dataset_loaded()
            if self.dataset:
                for idx, row in enumerate(self.dataset):
                    text = f"{row.get('kural', '')} {row.get('adhigaram', '')}"
                    if query in text:
                        matches.append(row.get("ID", idx + 1))

        if not matches:
            print(f"No couplets found matching '{query}'.")
            return

        print(f"✓ Found {len(matches)} matching couplet(s): {matches[:10]}{'...' if len(matches) > 10 else ''}")
        # Recite first match
        print(f"\n▶️ Reciting first match (Kural #{matches[0]}):")
        self.recite(matches[0])


def interactive_mode(reciter: KuralReciter):
    """Interactive Sacred Kural Recitation Terminal."""
    print("=" * 65)
    print("      🕉️  THIRUKKURAL SACRED RECITATION STUDIO (1 - 1330)  🕉️")
    print("=" * 65)
    print("Commands:")
    print("  • Type any number 1 to 1330 : Recite that Kural")
    print("  • 'r' or 'random'           : Recite a random Kural")
    print("  • 'search <keyword>'        : Search by Tamil / English word")
    print("  • 'ch <1-133>'              : Recite entire Chapter (10 kurals)")
    print("  • 'q' or 'exit'             : Quit")
    print("=" * 65)

    current_num = 1
    while True:
        try:
            user_in = input("\n[Kural Studio] Enter #, command, or press Enter for next: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nVanakkam & Nandri! 🙏")
            break

        if not user_in:
            reciter.recite(current_num)
            current_num = (current_num % 1330) + 1
            continue

        cmd = user_in.lower()
        if cmd in ("q", "exit", "quit"):
            print("Vanakkam & Nandri! 🙏")
            break
        elif cmd in ("r", "random"):
            rnd = random.randint(1, 1330)
            reciter.recite(rnd)
            current_num = (rnd % 1330) + 1
        elif cmd.startswith("search "):
            q = user_in[7:].strip()
            reciter.search_and_recite(q)
        elif cmd.startswith("ch ") or cmd.startswith("adhigaram "):
            parts = user_in.split(maxsplit=1)
            if len(parts) > 1:
                reciter.recite_adhigaram(parts[1])
        elif user_in.isdigit():
            k_id = int(user_in)
            if 1 <= k_id <= 1330:
                reciter.recite(k_id)
                current_num = (k_id % 1330) + 1
            else:
                print("Couplet number must be between 1 and 1330.")
        else:
            # Try searching the text directly
            reciter.search_and_recite(user_in)


def main():
    parser = argparse.ArgumentParser(description="Recite Thirukkural with authentic audio dataset.")
    parser.add_argument("query", nargs="*", default=[], help="Couplet number (1-1330), 'random', or search text")
    parser.add_argument("--adhigaram", "-a", type=str, default=None, help="Recite all 10 kurals of a chapter")
    parser.add_argument("--dataset", "-d", type=str, default=DEFAULT_DATASET_PATH, help="Path to thirukural-audio dataset")
    parser.add_argument("--interactive", "-i", action="store_true", help="Launch interactive studio")

    args = parser.parse_args()
    reciter = KuralReciter(dataset_or_path=args.dataset)

    if args.adhigaram:
        reciter.recite_adhigaram(args.adhigaram)
        return

    raw_query = " ".join(args.query).strip() if args.query else ""

    if args.interactive or not raw_query:
        interactive_mode(reciter)
        return

    query = raw_query
    if query.lower() == "random":
        reciter.recite_random()
    elif query.isdigit():
        reciter.recite(int(query))
    elif query.lower().startswith("search "):
        reciter.search_and_recite(query[7:].strip())
    else:
        reciter.search_and_recite(query)


if __name__ == "__main__":
    main()
