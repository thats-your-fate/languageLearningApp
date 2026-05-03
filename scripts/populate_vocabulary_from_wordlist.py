#!/usr/bin/env python3
"""
Populate src/data/vocabulary.json from an Oxford-style CSV word list.

Input CSV expected columns:
  id,en,level

Example:
  1,"a, an indefinite article",a1
  5,action n.,a1

The script calls the OpenAI API to generate:
  - a simple English example sentence
  - a short meaning lock
  - category/subcategory
  - translations and examples for app languages

Usage:
  export OPENAI_API_KEY=...
  python scripts/populate_vocabulary_from_wordlist.py --limit 50 --overwrite

Notes:
  - No API key is stored in this repo.
  - A checkpoint is written so long runs can resume.
  - The output schema matches src/types/vocabulary.ts.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = Path("/Users/yaro/projects/wordlist.csv")
DEFAULT_OUTPUT = PROJECT_ROOT / "src" / "data" / "vocabulary.json"
DEFAULT_CHECKPOINT = PROJECT_ROOT / "scripts" / ".vocabulary_generation_checkpoint.json"
DEFAULT_LANGUAGES = ["en", "de", "pt-BR", "it", "es", "fr"]
LEVELS = {"A1", "A2", "B1", "B2", "C1"}
PARTS_OF_SPEECH = [
    ("modal v.", "modal verb"),
    ("exclam.", "exclamation"),
    ("prep.", "preposition"),
    ("pron.", "pronoun"),
    ("conj.", "conjunction"),
    ("adj.", "adjective"),
    ("adv.", "adverb"),
    ("det.", "determiner"),
    ("number", "number"),
    ("n.", "noun"),
    ("v.", "verb")
]


@dataclass(frozen=True)
class WordRow:
    source_id: str
    raw_entry: str
    headword: str
    level: str
    part_of_speech_hint: str


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate app vocabulary JSON from wordlist.csv via OpenAI.")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="Path to source CSV.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Path to app vocabulary JSON.")
    parser.add_argument("--checkpoint", type=Path, default=DEFAULT_CHECKPOINT, help="Resume checkpoint path.")
    parser.add_argument("--languages", default=",".join(DEFAULT_LANGUAGES), help="Comma-separated language codes.")
    parser.add_argument("--model", default=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"), help="OpenAI model.")
    parser.add_argument("--batch-size", type=int, default=8, help="Rows per API call.")
    parser.add_argument("--limit", type=int, default=None, help="Optional max rows to process.")
    parser.add_argument("--start-at", type=int, default=0, help="Skip this many source rows before processing.")
    parser.add_argument("--sleep", type=float, default=0.2, help="Seconds to sleep between API calls.")
    parser.add_argument("--max-retries", type=int, default=3, help="Retries per batch before splitting.")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite output instead of appending/skipping.")
    parser.add_argument("--dry-run", action="store_true", help="Parse CSV and print planned rows without API calls.")
    args = parser.parse_args()

    languages = [item.strip() for item in args.languages.split(",") if item.strip()]
    if "en" not in languages:
      languages.insert(0, "en")

    rows = read_word_rows(args.input)
    rows = rows[args.start_at :]
    if args.limit is not None:
        rows = rows[: args.limit]

    if args.dry_run:
        print(json.dumps([row.__dict__ for row in rows[:20]], ensure_ascii=False, indent=2))
        print(f"Parsed {len(rows)} rows.")
        return 0

    ensure_openai_available()
    from openai import OpenAI

    client = OpenAI()
    existing_cards = [] if args.overwrite else read_existing_cards(args.output)
    existing_ids = {card.get("id") for card in existing_cards}
    checkpoint = {} if args.overwrite else read_checkpoint(args.checkpoint)
    generated_cards: list[dict[str, Any]] = []

    pending_rows = [row for row in rows if stable_card_id(row) not in existing_ids and row.source_id not in checkpoint]
    print(f"Rows loaded: {len(rows)}")
    print(f"Existing cards kept: {len(existing_cards)}")
    print(f"Rows to generate: {len(pending_rows)}")

    for batch_index, batch in enumerate(chunked(pending_rows, args.batch_size), start=1):
        print(f"Generating batch {batch_index}: {batch[0].source_id}..{batch[-1].source_id}")
        cards = generate_batch_resilient(client, args.model, batch, languages, args.max_retries)
        normalized_cards = [normalize_generated_card(row, cards[row.source_id], languages) for row in batch]
        generated_cards.extend(normalized_cards)

        for row, card in zip(batch, normalized_cards):
            checkpoint[row.source_id] = card["id"]

        write_json(args.checkpoint, checkpoint)
        write_json(args.output, sort_cards(existing_cards + generated_cards))
        time.sleep(args.sleep)

    write_json(args.output, sort_cards(existing_cards + generated_cards))
    print(f"Wrote {len(existing_cards) + len(generated_cards)} cards to {args.output}")
    return 0


def read_word_rows(path: Path) -> list[WordRow]:
    if not path.exists():
        raise FileNotFoundError(f"CSV not found: {path}")

    rows: list[WordRow] = []
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        required = {"id", "en", "level"}
        if not required.issubset(set(reader.fieldnames or [])):
            raise ValueError(f"CSV must include columns: {', '.join(sorted(required))}")

        for item in reader:
            raw_entry = (item.get("en") or "").strip()
            level = (item.get("level") or "").strip().upper()
            if not raw_entry or level not in LEVELS:
                continue
            rows.append(
                WordRow(
                    source_id=(item.get("id") or "").strip(),
                    raw_entry=raw_entry,
                    headword=parse_headword(raw_entry),
                    level=level,
                    part_of_speech_hint=parse_part_of_speech(raw_entry)
                )
            )
    return rows


def parse_headword(raw_entry: str) -> str:
    cleaned = raw_entry.strip()
    cleaned = cleaned.replace(" indefinite article", "").replace(" definite article", "")
    marker_positions = [
        match.start()
        for marker, _label in PARTS_OF_SPEECH
        if (match := re.search(marker_pattern(marker), cleaned))
    ]
    if marker_positions:
        cleaned = cleaned[: min(marker_positions)]
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" ,.;")
    return cleaned or raw_entry.split()[0].strip(" ,.;")


def parse_part_of_speech(raw_entry: str) -> str:
    if "indefinite article" in raw_entry or "definite article" in raw_entry:
        return "determiner"

    for marker, label in PARTS_OF_SPEECH:
        if re.search(marker_pattern(marker), raw_entry):
            return label
    return "word"


def marker_pattern(marker: str) -> str:
    return rf"(?<![A-Za-z]){re.escape(marker)}(?![A-Za-z])"


def stable_card_id(row: WordRow) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", row.headword.lower()).strip("_")
    pos = re.sub(r"[^a-z0-9]+", "_", row.part_of_speech_hint.lower()).strip("_") or "word"
    return f"{slug}_{pos}_{int(row.source_id):04d}" if row.source_id.isdigit() else f"{slug}_{pos}_{row.source_id}"


def generate_batch(client: Any, model: str, batch: list[WordRow], languages: list[str]) -> list[dict[str, Any]]:
    payload = {
        "languages": languages,
        "rows": [row.__dict__ | {"stableId": stable_card_id(row)} for row in batch],
        "appCardShape": {
            "id": "stable id",
            "level": "A1",
            "category": "Food",
            "subcategory": "Basic food",
            "type": "word",
            "partOfSpeech": "noun",
            "english": {"text": "cheese", "example": "I like cheese."},
            "meaningLock": "A food made from milk.",
            "translations": {
                "en": {"text": "cheese", "example": "I like cheese."},
                "de": {"text": "Käse", "example": "Ich mag Käse."}
            },
            "qa": {"checked": True, "suitableForLevel": True}
        }
    }

    response = client.responses.create(
        model=model,
        input=[
            {
                "role": "system",
                "content": (
                    "You create beginner language-learning vocabulary cards. "
                    "Return only JSON matching the schema. Keep examples natural, short, and CEFR-level appropriate. "
                    "The English example must be created first, then each translation example should preserve the same meaning. "
                    "Do not add offensive, adult, political, or culturally sensitive examples. "
                    "Use Brazilian Portuguese for pt-BR. Preserve the provided stableId as id."
                )
            },
            {"role": "user", "content": json.dumps(payload, ensure_ascii=False)}
        ],
        text={
            "format": {
                "type": "json_schema",
                "name": "vocabulary_batch",
                "strict": True,
                "schema": vocabulary_batch_schema(languages)
            }
        }
    )

    data = json.loads(response.output_text)
    cards = data.get("cards", [])
    if len(cards) != len(batch):
        raise ValueError(f"Expected {len(batch)} cards, got {len(cards)}")
    return cards


def generate_batch_resilient(
    client: Any,
    model: str,
    batch: list[WordRow],
    languages: list[str],
    max_retries: int
) -> dict[str, dict[str, Any]]:
    try:
        cards = generate_batch_with_retries(client, model, batch, languages, max_retries)
        return map_cards_to_rows(batch, cards)
    except Exception as error:
        if len(batch) == 1:
            raise

        midpoint = max(1, len(batch) // 2)
        left = batch[:midpoint]
        right = batch[midpoint:]
        print(
            f"Batch {batch[0].source_id}..{batch[-1].source_id} failed ({error}). "
            f"Retrying as {left[0].source_id}..{left[-1].source_id} and {right[0].source_id}..{right[-1].source_id}"
        )
        generated: dict[str, dict[str, Any]] = {}
        generated.update(generate_batch_resilient(client, model, left, languages, max_retries))
        generated.update(generate_batch_resilient(client, model, right, languages, max_retries))
        return generated


def generate_batch_with_retries(
    client: Any,
    model: str,
    batch: list[WordRow],
    languages: list[str],
    max_retries: int
) -> list[dict[str, Any]]:
    last_error: Exception | None = None
    for attempt in range(1, max_retries + 1):
        try:
            return generate_batch(client, model, batch, languages)
        except Exception as error:
            last_error = error
            wait = min(10, attempt * 1.5)
            print(
                f"Attempt {attempt}/{max_retries} failed for "
                f"{batch[0].source_id}..{batch[-1].source_id}: {error}. Waiting {wait:.1f}s"
            )
            time.sleep(wait)

    assert last_error is not None
    raise last_error


def map_cards_to_rows(batch: list[WordRow], cards: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    by_id = {str(card.get("id")): card for card in cards}
    mapped: dict[str, dict[str, Any]] = {}
    missing: list[str] = []

    for row in batch:
        stable_id = stable_card_id(row)
        card = by_id.get(stable_id)
        if card is None:
            missing.append(f"{row.source_id}:{stable_id}")
        else:
            mapped[row.source_id] = card

    if missing:
        raise ValueError(f"Generated response missing cards: {', '.join(missing)}")
    return mapped


def vocabulary_batch_schema(languages: list[str]) -> dict[str, Any]:
    translation_schema = {
        "type": "object",
        "properties": {
            "text": {"type": "string"},
            "example": {"type": "string"}
        },
        "required": ["text", "example"],
        "additionalProperties": False
    }
    return {
        "type": "object",
        "properties": {
            "cards": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string"},
                        "level": {"type": "string", "enum": ["A1", "A2", "B1", "B2", "C1"]},
                        "category": {"type": "string"},
                        "subcategory": {"type": "string"},
                        "type": {"type": "string", "enum": ["word", "phrase"]},
                        "partOfSpeech": {"type": "string"},
                        "english": translation_schema,
                        "meaningLock": {"type": "string"},
                        "translations": {
                            "type": "object",
                            "properties": {language: translation_schema for language in languages},
                            "required": languages,
                            "additionalProperties": False
                        },
                        "qa": {
                            "type": "object",
                            "properties": {
                                "checked": {"type": "boolean"},
                                "suitableForLevel": {"type": "boolean"},
                                "notes": {"type": "string"}
                            },
                            "required": ["checked", "suitableForLevel", "notes"],
                            "additionalProperties": False
                        }
                    },
                    "required": [
                        "id",
                        "level",
                        "category",
                        "subcategory",
                        "type",
                        "partOfSpeech",
                        "english",
                        "meaningLock",
                        "translations",
                        "qa"
                    ],
                    "additionalProperties": False
                }
            }
        },
        "required": ["cards"],
        "additionalProperties": False
    }


def normalize_generated_card(row: WordRow, card: dict[str, Any], languages: list[str]) -> dict[str, Any]:
    stable_id = stable_card_id(row)
    translations = card.get("translations") or {}
    english = card.get("english") or translations.get("en") or {"text": row.headword, "example": ""}
    normalized_translations = {}

    for language in languages:
        value = translations.get(language) or {}
        normalized_translations[language] = {
            "text": clean_string(value.get("text")) or clean_string(english.get("text")) or row.headword,
            "example": clean_string(value.get("example")) or clean_string(english.get("example")) or f"I use {row.headword}."
        }

    normalized_translations["en"] = {
        "text": clean_string(english.get("text")) or normalized_translations["en"]["text"],
        "example": clean_string(english.get("example")) or normalized_translations["en"]["example"]
    }

    return {
        "id": stable_id,
        "level": row.level,
        "category": clean_string(card.get("category")) or "General",
        "subcategory": clean_string(card.get("subcategory")) or "Core vocabulary",
        "type": clean_string(card.get("type")) or "word",
        "partOfSpeech": clean_string(card.get("partOfSpeech")) or row.part_of_speech_hint,
        "english": normalized_translations["en"],
        "meaningLock": clean_string(card.get("meaningLock")) or f"The meaning of '{row.headword}'.",
        "translations": normalized_translations,
        "qa": {
            "checked": bool((card.get("qa") or {}).get("checked", True)),
            "suitableForLevel": bool((card.get("qa") or {}).get("suitableForLevel", True)),
            "notes": clean_string((card.get("qa") or {}).get("notes"))
        }
    }


def read_existing_cards(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, list):
        raise ValueError(f"Existing output is not a JSON array: {path}")
    return data


def read_checkpoint(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    return data if isinstance(data, dict) else {}


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(f"{path.suffix}.tmp")
    with tmp_path.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    tmp_path.replace(path)


def sort_cards(cards: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(cards, key=lambda card: (str(card.get("level", "")), str(card.get("id", ""))))


def clean_string(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def chunked(items: list[WordRow], size: int) -> list[list[WordRow]]:
    return [items[index : index + size] for index in range(0, len(items), size)]


def ensure_openai_available() -> None:
    if not os.getenv("OPENAI_API_KEY"):
        raise RuntimeError("OPENAI_API_KEY is not set. Export it before running this script.")
    try:
        import openai  # noqa: F401
    except ImportError as exc:
        raise RuntimeError("Python package 'openai' is missing. Install it with: python -m pip install openai") from exc


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"Error: {error}", file=sys.stderr)
        raise SystemExit(1)
