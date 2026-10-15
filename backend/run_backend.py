"""
Runner script for Thirukural Voice & Venpa Meter FastAPI Backend.
Executes with standard `py run_backend.py` or `python run_backend.py`.
"""
import sys
import uvicorn

if __name__ == "__main__":
    print("=" * 60)
    print("  THIRUKURAL VOICE ENGINE - FASTAPI BACKEND")
    print("  Whisper Domain Prompting + Tamil Numeral Parser + Venpa Audio")
    print("=" * 60)
    print("Starting server at http://127.0.0.1:8000 ...")
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
