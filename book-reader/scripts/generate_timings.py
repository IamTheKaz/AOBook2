#!/usr/bin/env python3
"""
generate_timings.py
--------------------
Generates the word-level timing JSON the reader site needs for karaoke-style
highlighting, straight from a narration audio file. No manual transcript
needed — it transcribes AND times the words in one pass.

SETUP (run once, on your own machine):
    pip install faster-whisper

USAGE:
    python generate_timings.py path/to/chapter1_part1.mp3 assets/timings/chapter1_part1.json

    # Optional: pick a model size (base is a good speed/accuracy default;
    # small or medium is more accurate but slower)
    python generate_timings.py part1.mp3 out.json --model small

WHAT IT PRODUCES:
    {
      "words": [
        {"w": "Once", "s": 0.00, "e": 0.32},
        {"w": "upon", "s": 0.34, "e": 0.55},
        ...
      ]
    }

TIP: If the auto-transcription misspells a word (it happens with unusual
names), just fix the "w" text by hand afterward in the JSON file — the
timing (s/e) will still be correct, since it's based on the audio.
"""

import argparse
import json
import sys


def main():
    parser = argparse.ArgumentParser(description="Generate word-timing JSON from a narration audio file.")
    parser.add_argument("audio", help="Path to the narration audio file (mp3/wav/m4a).")
    parser.add_argument("out", help="Path to write the timing JSON to.")
    parser.add_argument("--model", default="base",
                         help="faster-whisper model size: tiny, base, small, medium, large-v3 (default: base)")
    args = parser.parse_args()

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print("Missing dependency. Run:  pip install faster-whisper", file=sys.stderr)
        sys.exit(1)

    print(f"Loading model '{args.model}'…")
    model = WhisperModel(args.model, compute_type="int8")

    print(f"Transcribing {args.audio} (this can take a while for long audio)…")
    segments, _info = model.transcribe(args.audio, word_timestamps=True)

    words = []
    for segment in segments:
        for word in segment.words:
            words.append({
                "w": word.word.strip(),
                "s": round(word.start, 2),
                "e": round(word.end, 2),
            })

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump({"words": words}, f, indent=2, ensure_ascii=False)

    print(f"Wrote {len(words)} words to {args.out}")


if __name__ == "__main__":
    main()
