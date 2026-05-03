#!/usr/bin/env python3
"""
Resume vocabulary generation after an interrupted OpenAI batch.

This script:
  - loads OPENAI_API_KEY from server/.env if present
  - reads the checkpoint and source CSV
  - finds the first source row not in the checkpoint
  - calls populate_vocabulary_from_wordlist.py without --overwrite

Usage:
  python3 scripts/recover_vocabulary_generation.py
  python3 scripts/recover_vocabulary_generation.py --batch-size 4
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

import populate_vocabulary_from_wordlist as generator


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = PROJECT_ROOT / "server" / ".env"


def main() -> int:
    parser = argparse.ArgumentParser(description="Resume vocabulary generation from the checkpoint.")
    parser.add_argument("--batch-size", type=int, default=4, help="Smaller default for recovery stability.")
    parser.add_argument("--sleep", type=float, default=0.4)
    parser.add_argument("--model", default=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"))
    parser.add_argument("--max-retries", type=int, default=4)
    args = parser.parse_args()

    load_env_file(ENV_PATH)
    rows = generator.read_word_rows(generator.DEFAULT_INPUT)
    checkpoint = generator.read_checkpoint(generator.DEFAULT_CHECKPOINT)
    first_missing_index = next(
        (
            index
            for index, row in enumerate(rows)
            if row.source_id not in checkpoint
        ),
        len(rows)
    )

    if first_missing_index >= len(rows):
        print("Checkpoint already covers every row in the CSV.")
        return 0

    first_missing = rows[first_missing_index]
    print(f"Checkpoint rows: {len(checkpoint)}")
    print(f"Resuming at CSV row offset {first_missing_index}, source id {first_missing.source_id}")
    print(f"Existing output cards: {len(generator.read_existing_cards(generator.DEFAULT_OUTPUT))}")

    command = [
        sys.executable,
        str(PROJECT_ROOT / "scripts" / "populate_vocabulary_from_wordlist.py"),
        "--start-at",
        str(first_missing_index),
        "--batch-size",
        str(args.batch_size),
        "--sleep",
        str(args.sleep),
        "--model",
        args.model,
        "--max-retries",
        str(args.max_retries)
    ]
    return subprocess.call(command, cwd=PROJECT_ROOT, env=os.environ.copy())


def load_env_file(path: Path) -> None:
    if not path.exists():
        return

    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


if __name__ == "__main__":
    raise SystemExit(main())
