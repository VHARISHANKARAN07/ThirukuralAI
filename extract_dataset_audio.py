"""
Thirukural Audio Extraction Utility
Extracts all 1,330 authentic recitation tracks from the Hugging Face dataset
into local audio directories for instant offline playback in both:
1. Backend: backend/audio/{id}.mp3
2. Frontend static web server: audio/{id}.mp3
"""

import sys
import time
from pathlib import Path

# Ensure UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8')

DATASET_PATH = r"C:\Users\User\Downloads\thirukural-audio"
BASE_DIR = Path(__file__).resolve().parent

BACKEND_AUDIO_DIR = BASE_DIR / "backend" / "audio"
FRONTEND_AUDIO_DIR = BASE_DIR / "audio"

def extract_all_audio(dataset_path=DATASET_PATH):
    print("=" * 65)
    print("  THIRUKKURAL SACRED RECITATION AUDIO EXTRACTOR (1 to 1330)")
    print("=" * 65)
    print(f"Loading dataset from: {dataset_path} ...")
    
    start_time = time.time()
    try:
        from datasets import load_from_disk, Audio
    except ImportError:
        print("Error: 'datasets' package not found. Please install via pip install datasets.")
        sys.exit(1)
        
    ds = load_from_disk(dataset_path)
    train = ds["train"].cast_column("audio", Audio(decode=False))
    total = len(train)
    print(f"✓ Dataset loaded in {time.time() - start_time:.2f}s! Total couplets: {total}")

    # Ensure output directories exist
    BACKEND_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    FRONTEND_AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    extracted_count = 0
    total_bytes = 0

    print(f"Extracting 1,330 couplet MP3 files...")
    batch_start = time.time()

    for idx in range(total):
        row = train[idx]
        kural_id = row.get("ID", idx + 1)
        audio_info = row.get("audio", {})
        audio_bytes = audio_info.get("bytes")

        if not audio_bytes:
            print(f"⚠️ Warning: Missing audio bytes for Kural #{kural_id}")
            continue

        filename = f"{kural_id}.mp3"
        
        # Save to backend/audio/
        backend_file = BACKEND_AUDIO_DIR / filename
        backend_file.write_bytes(audio_bytes)

        # Save to static frontend audio/
        frontend_file = FRONTEND_AUDIO_DIR / filename
        frontend_file.write_bytes(audio_bytes)

        extracted_count += 1
        total_bytes += len(audio_bytes)

        if (idx + 1) % 100 == 0 or (idx + 1) == total:
            elapsed = time.time() - batch_start
            print(f"  [{idx + 1:4d}/{total}] Saved up to Kural #{kural_id} ({total_bytes / (1024*1024):.1f} MB written)...")

    duration = time.time() - start_time
    print("=" * 65)
    print(f"✓ SUCCESSFULLY EXTRACTED {extracted_count} RECITATION TRACKS!")
    print(f"  • Total Size: {total_bytes / (1024*1024):.2f} MB")
    print(f"  • Backend Directory:  {BACKEND_AUDIO_DIR}")
    print(f"  • Frontend Directory: {FRONTEND_AUDIO_DIR}")
    print(f"  • Completed in: {duration:.2f}s")
    print("=" * 65)

if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else DATASET_PATH
    extract_all_audio(path)
