#!/usr/bin/env python3
"""
Pre-generate OpenAI TTS MP3 files for app vocabulary.

This writes files into server/.tts-cache using the same cache-key format as
server/index.js, so the backend can serve cached audio without calling OpenAI
again at playback time.

Usage:
  python3 scripts/generate_tts_cache.py --limit 20
  python3 scripts/generate_tts_cache.py --languages pt-BR,en --levels A1
  python3 scripts/generate_tts_cache.py --fields text,example

Notes:
  - OPENAI_API_KEY is loaded from server/.env if present.
  - The script checkpoints by cache key, so interrupted runs resume safely.
  - No API key or generated cache files are committed.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_VOCABULARY = PROJECT_ROOT / "src" / "data" / "vocabulary.json"
DEFAULT_CACHE_DIR = PROJECT_ROOT / "server" / ".tts-cache"
DEFAULT_CHECKPOINT = PROJECT_ROOT / "scripts" / ".tts_cache_generation_checkpoint.json"
ENV_PATH = PROJECT_ROOT / "server" / ".env"
DEFAULT_LANGUAGES = ["en", "de", "pt-BR", "it", "es", "fr"]
DEFAULT_FIELDS = ["text", "example"]


@dataclass(frozen=True)
class TtsItem:
    language: str
    text: str
    card_id: str
    field: str


def main() -> int:
    load_env_file(ENV_PATH)

    parser = argparse.ArgumentParser(description="Generate OpenAI TTS cache files for vocabulary audio.")
    parser.add_argument("--input", type=Path, default=DEFAULT_VOCABULARY)
    parser.add_argument("--cache-dir", type=Path, default=DEFAULT_CACHE_DIR)
    parser.add_argument("--checkpoint", type=Path, default=DEFAULT_CHECKPOINT)
    parser.add_argument("--languages", default=",".join(DEFAULT_LANGUAGES), help="Comma-separated language codes.")
    parser.add_argument("--levels", default="", help="Optional comma-separated CEFR levels, e.g. A1,A2.")
    parser.add_argument("--fields", default=",".join(DEFAULT_FIELDS), help="Comma-separated fields: text,example.")
    parser.add_argument("--model", default=os.getenv("OPENAI_TTS_MODEL", "tts-1"))
    parser.add_argument("--voice", default=os.getenv("OPENAI_TTS_VOICE", "alloy"))
    parser.add_argument("--limit", type=int, default=None, help="Optional max unique audio items.")
    parser.add_argument("--start-at", type=int, default=0, help="Skip this many unique audio items.")
    parser.add_argument("--sleep", type=float, default=0.05, help="Seconds to sleep between TTS calls.")
    parser.add_argument("--max-retries", type=int, default=3)
    parser.add_argument("--force", action="store_true", help="Regenerate even if checkpoint/file exists.")
    parser.add_argument("--dry-run", action="store_true", help="Print planned items without calling OpenAI.")
    args = parser.parse_args()

    languages = parse_csv(args.languages) or DEFAULT_LANGUAGES
    levels = {level.upper() for level in parse_csv(args.levels)}
    fields = parse_csv(args.fields) or DEFAULT_FIELDS
    invalid_fields = sorted(set(fields) - {"text", "example"})
    if invalid_fields:
        raise ValueError(f"Unsupported fields: {', '.join(invalid_fields)}")

    cards = read_json(args.input)
    items = collect_tts_items(cards, languages, fields, levels)
    unique_items = dedupe_items(items, args.model, args.voice)
    unique_items = unique_items[args.start_at :]
    if args.limit is not None:
        unique_items = unique_items[: args.limit]

    print(f"Cards loaded: {len(cards)}")
    print(f"Unique audio items selected: {len(unique_items)}")
    print(f"Languages: {', '.join(languages)}")
    print(f"Fields: {', '.join(fields)}")
    print(f"Cache dir: {args.cache_dir}")

    if args.dry_run:
        preview = [
            {
                "language": item.language,
                "field": item.field,
                "cardId": item.card_id,
                "text": item.text,
                "file": cache_filename(args.model, args.voice, item)
            }
            for item in unique_items[:30]
        ]
        print(json.dumps(preview, ensure_ascii=False, indent=2))
        return 0

    ensure_openai_available()
    from openai import OpenAI

    args.cache_dir.mkdir(parents=True, exist_ok=True)
    checkpoint = {} if args.force else read_json(args.checkpoint, default={})
    client = OpenAI()
    generated = 0
    skipped = 0

    for index, item in enumerate(unique_items, start=1):
        key = cache_key(args.model, args.voice, item.language, item.text)
        file_path = args.cache_dir / f"{key}.mp3"
        if not args.force and checkpoint.get(key) == "ok" and file_path.exists():
            skipped += 1
            continue

        print(f"[{index}/{len(unique_items)}] {item.language} {item.field} {item.card_id}: {item.text[:80]}")
        audio = generate_speech_with_retries(client, args.model, args.voice, item.text[:700], args.max_retries)
        file_path.write_bytes(audio)
        checkpoint[key] = "ok"
        write_json(args.checkpoint, checkpoint)
        generated += 1
        time.sleep(args.sleep)

    print(f"Generated: {generated}")
    print(f"Skipped cached: {skipped}")
    print(f"Checkpoint: {args.checkpoint}")
    return 0


def collect_tts_items(
    cards: list[dict[str, Any]],
    languages: list[str],
    fields: list[str],
    levels: set[str]
) -> list[TtsItem]:
    items: list[TtsItem] = []
    for card in cards:
        if levels and str(card.get("level", "")).upper() not in levels:
            continue

        card_id = str(card.get("id") or "unknown")
        translations = card.get("translations") or {}
        for language in languages:
            translation = translations.get(language)
            if not isinstance(translation, dict):
                continue
            for field in fields:
                text = str(translation.get(field) or "").strip()
                if text:
                    items.append(TtsItem(language=language, text=text, card_id=card_id, field=field))
    return items


def dedupe_items(items: list[TtsItem], model: str, voice: str) -> list[TtsItem]:
    seen: set[str] = set()
    unique: list[TtsItem] = []
    for item in items:
        key = cache_key(model, voice, item.language, item.text)
        if key in seen:
            continue
        seen.add(key)
        unique.append(item)
    return unique


def generate_speech_with_retries(client: Any, model: str, voice: str, text: str, max_retries: int) -> bytes:
    last_error: Exception | None = None
    for attempt in range(1, max_retries + 1):
        try:
            response = client.audio.speech.create(
                model=model,
                voice=voice,
                input=text,
                response_format="mp3"
            )
            return bytes(response.content) if hasattr(response, "content") else bytes(response.read())
        except Exception as error:
            last_error = error
            wait = min(20, attempt * 2)
            print(f"Attempt {attempt}/{max_retries} failed: {error}. Waiting {wait}s")
            time.sleep(wait)
    assert last_error is not None
    raise last_error


def cache_key(model: str, voice: str, language: str, text: str) -> str:
    payload = json.dumps(
        {"model": model, "voice": voice, "language": language, "text": text[:700]},
        ensure_ascii=False,
        separators=(",", ":")
    )
    # Match JSON.stringify output from server/index.js, including compact separators.
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def cache_filename(model: str, voice: str, item: TtsItem) -> str:
    return f"{cache_key(model, voice, item.language, item.text)}.mp3"


def read_json(path: Path, default: Any | None = None) -> Any:
    if not path.exists():
        if default is not None:
            return default
        raise FileNotFoundError(path)
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def parse_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def load_env_file(path: Path) -> None:
    if not path.exists():
        return

    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def ensure_openai_available() -> None:
    if not os.getenv("OPENAI_API_KEY"):
        raise RuntimeError("OPENAI_API_KEY is not set. Add it to server/.env or export it before running.")
    try:
        import openai  # noqa: F401
    except ImportError as error:
        raise RuntimeError("Install the OpenAI Python package first: pip install openai") from error


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("\nInterrupted.")
        raise SystemExit(130)
