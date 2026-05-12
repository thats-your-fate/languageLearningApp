#!/usr/bin/env python3
"""
Check and fix vocabulary translations/examples with OpenAI.

The script validates each card translation per language:
  - translated word/phrase is in the requested language
  - example sentence is in the requested language
  - translated word/phrase preserves the English/meaningLock meaning
  - example sentence preserves the English example meaning and uses the vocabulary item naturally

By default this fixes vocabulary.json in place as each card is checked.

Usage:
  python3 scripts/qa_vocabulary_with_openai.py --limit 20
  python3 scripts/qa_vocabulary_with_openai.py --check-only --limit 20
  python3 scripts/qa_vocabulary_with_openai.py --output src/data/vocabulary.fixed.json

Notes:
  - OPENAI_API_KEY is loaded from server/.env if present.
  - The default batch size is 1, so fixes are applied and written after each checked card.
  - Checkpointing lets long runs resume safely.
  - No API key is stored in this repo.
"""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import os
import sys
import time
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = PROJECT_ROOT / "src" / "data" / "vocabulary.json"
DEFAULT_REPORT = PROJECT_ROOT / "scripts" / "vocabulary_qa_report.json"
DEFAULT_CHECKPOINT = PROJECT_ROOT / "scripts" / ".vocabulary_qa_checkpoint.json"
ENV_PATH = PROJECT_ROOT / "server" / ".env"
DEFAULT_LANGUAGES = ["en", "de", "pt-BR", "it", "es", "fr"]


def main() -> int:
    parser = argparse.ArgumentParser(description="QA and fix vocabulary JSON with OpenAI.")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=None, help="Where to write fixed vocabulary. Defaults to overwriting --input.")
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--checkpoint", type=Path, default=DEFAULT_CHECKPOINT)
    parser.add_argument("--languages", default=",".join(DEFAULT_LANGUAGES), help="Comma-separated languages to check.")
    parser.add_argument("--model", default=os.getenv("OPENAI_QA_MODEL", os.getenv("OPENAI_MODEL", "gpt-4.1-mini")))
    parser.add_argument("--batch-size", type=int, default=1, help="Cards per API request. Defaults to 1 so fixes are written card-by-card.")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--start-at", type=int, default=0)
    parser.add_argument("--sleep", type=float, default=0.25)
    parser.add_argument("--max-retries", type=int, default=3)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--fix", dest="fix", action="store_true", help="Apply suggested text/example fixes. This is the default.")
    mode.add_argument("--check-only", dest="fix", action="store_false", help="Only write the QA report; do not change vocabulary JSON.")
    parser.add_argument("--in-place", action="store_true", help="Overwrite the input file. This is the default when no --output is provided.")
    parser.add_argument("--force", action="store_true", help="Ignore checkpoint and re-check selected cards.")
    parser.set_defaults(fix=True)
    args = parser.parse_args()

    load_env_file(ENV_PATH)
    ensure_openai_available()
    from openai import OpenAI

    languages = [item.strip() for item in args.languages.split(",") if item.strip()]
    cards = read_cards(args.input)
    selected_cards = cards[args.start_at :]
    if args.limit is not None:
        selected_cards = selected_cards[: args.limit]

    report = read_json(args.report, default={"results": {}, "summary": {}})
    checkpoint = {} if args.force else read_json(args.checkpoint, default={})
    report_results = report.setdefault("results", {})
    fixed_cards = copy.deepcopy(cards)
    fixed_by_id = {str(card.get("id")): card for card in fixed_cards}
    if args.fix:
        for card_id, result in report_results.items():
            if card_id in fixed_by_id:
                apply_fixes(fixed_by_id[card_id], result, languages)

    pending = [
        card
        for card in selected_cards
        if args.force or checkpoint.get(str(card.get("id"))) != card_signature(card, languages)
    ]

    print(f"Cards loaded: {len(cards)}")
    print(f"Cards selected: {len(selected_cards)}")
    print(f"Cards pending QA: {len(pending)}")
    print(f"Mode: {'check + fix immediately' if args.fix else 'check only'}")

    client = OpenAI()
    for batch_index, batch in enumerate(chunked(pending, args.batch_size), start=1):
        label = str(batch[0].get("id")) if len(batch) == 1 else f"{batch[0].get('id')}..{batch[-1].get('id')}"
        print(f"Checking batch {batch_index}: {label}")
        result_by_id = check_batch_with_retries(client, args.model, batch, languages, args.max_retries)

        for card in batch:
            card_id = str(card.get("id"))
            result = result_by_id[card_id]
            report_results[card_id] = result
            if args.fix:
                changed_languages = apply_fixes(fixed_by_id[card_id], result, languages)
                if changed_languages:
                    print(f"Fixed {card_id}: {', '.join(changed_languages)}")
                checkpoint[card_id] = card_signature(fixed_by_id[card_id], languages)
            else:
                checkpoint[card_id] = card_signature(card, languages)

        write_json(args.checkpoint, checkpoint)
        write_json(args.report, with_summary(report))
        if args.fix:
            write_json(get_output_path(args), fixed_cards)
        time.sleep(args.sleep)

    write_json(args.report, with_summary(report))
    if args.fix:
        output_path = get_output_path(args)
        write_json(output_path, fixed_cards)
        print(f"Wrote fixed vocabulary to {output_path}")
    print(f"Wrote QA report to {args.report}")
    return 0


def check_batch_with_retries(
    client: Any,
    model: str,
    batch: list[dict[str, Any]],
    languages: list[str],
    max_retries: int
) -> dict[str, dict[str, Any]]:
    last_error: Exception | None = None
    for attempt in range(1, max_retries + 1):
        try:
            return check_batch(client, model, batch, languages)
        except Exception as error:
            last_error = error
            wait = min(12, attempt * 1.7)
            print(f"Attempt {attempt}/{max_retries} failed: {error}. Waiting {wait:.1f}s")
            time.sleep(wait)
    assert last_error is not None
    raise last_error


def check_batch(client: Any, model: str, batch: list[dict[str, Any]], languages: list[str]) -> dict[str, dict[str, Any]]:
    payload = {
        "languages": languages,
        "cards": [compact_card(card, languages) for card in batch]
    }
    response = client.responses.create(
        model=model,
        input=[
            {
                "role": "system",
                "content": (
                    "You are a careful multilingual vocabulary QA editor for a beginner language-learning app. "
                    "Validate translations and examples against the English text, English example, and meaningLock. "
                    "For each language, check that the word or phrase is in that language, preserves the intended meaning, "
                    "and that the example sentence is natural, in that language, uses the vocabulary item or a correct inflected form, "
                    "and preserves the English example meaning. Use Brazilian Portuguese for pt-BR. "
                    "For every warning or error, provide fixedText and fixedExample that can be written directly to the app data. "
                    "Preserve CEFR simplicity and do not change ids, levels, categories, or English unless English itself is invalid. "
                    "Return only valid JSON."
                )
            },
            {"role": "user", "content": json.dumps(payload, ensure_ascii=False)}
        ],
        text={
            "format": {
                "type": "json_schema",
                "name": "vocabulary_qa_batch",
                "strict": True,
                "schema": qa_schema(languages)
            }
        }
    )
    data = json.loads(response.output_text)
    results = data.get("results", [])
    if len(results) != len(batch):
        raise ValueError(f"Expected {len(batch)} QA results, got {len(results)}")

    by_id = {str(result.get("id")): result for result in results}
    missing = [str(card.get("id")) for card in batch if str(card.get("id")) not in by_id]
    if missing:
        if len(batch) == 1 and len(results) == 1:
            expected_id = str(batch[0].get("id"))
            returned_id = str(results[0].get("id"))
            print(f"Warning: QA response returned id {returned_id!r}; using expected id {expected_id!r}.")
            results[0]["id"] = expected_id
            return {expected_id: results[0]}
        raise ValueError(f"QA response missing card ids: {', '.join(missing)}")
    return by_id


def qa_schema(languages: list[str]) -> dict[str, Any]:
    language_result = {
        "type": "object",
        "properties": {
            "validLanguage": {"type": "boolean"},
            "wordMeaningPreserved": {"type": "boolean"},
            "exampleMeaningPreserved": {"type": "boolean"},
            "exampleUsesWordNaturally": {"type": "boolean"},
            "severity": {"type": "string", "enum": ["ok", "warning", "error"]},
            "issues": {"type": "array", "items": {"type": "string"}},
            "fixedText": {"type": "string"},
            "fixedExample": {"type": "string"},
            "fixReason": {"type": "string"}
        },
        "required": [
            "validLanguage",
            "wordMeaningPreserved",
            "exampleMeaningPreserved",
            "exampleUsesWordNaturally",
            "severity",
            "issues",
            "fixedText",
            "fixedExample",
            "fixReason"
        ],
        "additionalProperties": False
    }
    return {
        "type": "object",
        "properties": {
            "results": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string"},
                        "overallSeverity": {"type": "string", "enum": ["ok", "warning", "error"]},
                        "notes": {"type": "string"},
                        "languages": {
                            "type": "object",
                            "properties": {language: language_result for language in languages},
                            "required": languages,
                            "additionalProperties": False
                        }
                    },
                    "required": ["id", "overallSeverity", "notes", "languages"],
                    "additionalProperties": False
                }
            }
        },
        "required": ["results"],
        "additionalProperties": False
    }


def compact_card(card: dict[str, Any], languages: list[str]) -> dict[str, Any]:
    translations = card.get("translations") or {}
    return {
        "id": card.get("id"),
        "level": card.get("level"),
        "partOfSpeech": card.get("partOfSpeech"),
        "english": card.get("english") or translations.get("en"),
        "meaningLock": card.get("meaningLock"),
        "translations": {language: translations.get(language, {"text": "", "example": ""}) for language in languages}
    }


def apply_fixes(card: dict[str, Any], result: dict[str, Any], languages: list[str]) -> list[str]:
    translations = card.setdefault("translations", {})
    changed_languages: list[str] = []
    for language in languages:
        language_result = (result.get("languages") or {}).get(language) or {}
        if language_result.get("severity") == "ok":
            continue
        fixed_text = clean_string(language_result.get("fixedText"))
        fixed_example = clean_string(language_result.get("fixedExample"))
        if not fixed_text or not fixed_example:
            continue
        current = translations.setdefault(language, {})
        if fixed_text != clean_string(current.get("text")) or fixed_example != clean_string(current.get("example")):
            current["text"] = fixed_text
            current["example"] = fixed_example
            changed_languages.append(language)

    if changed_languages:
        card["qa"] = {
            **(card.get("qa") or {}),
            "checked": True,
            "notes": clean_string(
                f"{card.get('qa', {}).get('notes', '')} QA fixed: {', '.join(changed_languages)}"
            )
        }
    return changed_languages


def with_summary(report: dict[str, Any]) -> dict[str, Any]:
    results = report.get("results", {})
    summary = {"cards": len(results), "ok": 0, "warning": 0, "error": 0, "languageErrors": {}}
    for result in results.values():
        severity = result.get("overallSeverity", "error")
        summary[severity] = summary.get(severity, 0) + 1
        for language, language_result in (result.get("languages") or {}).items():
            if language_result.get("severity") != "ok":
                summary["languageErrors"][language] = summary["languageErrors"].get(language, 0) + 1
    report["summary"] = summary
    return report


def get_output_path(args: argparse.Namespace) -> Path:
    if args.in_place or args.output is None:
        return args.input
    return args.output


def card_signature(card: dict[str, Any], languages: list[str]) -> str:
    payload = compact_card(card, languages)
    raw = json.dumps(payload, ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def read_cards(path: Path) -> list[dict[str, Any]]:
    data = read_json(path, default=[])
    if not isinstance(data, list):
        raise ValueError(f"Vocabulary file must be a JSON array: {path}")
    return data


def read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(f"{path.suffix}.tmp")
    with tmp_path.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    tmp_path.replace(path)


def clean_string(value: Any) -> str:
    return " ".join(str(value or "").split()).strip()


def chunked(items: list[dict[str, Any]], size: int) -> list[list[dict[str, Any]]]:
    return [items[index : index + size] for index in range(0, len(items), size)]


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
    except ImportError as exc:
        raise RuntimeError("Python package 'openai' is missing. Install it with: python3 -m pip install openai") from exc


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"Error: {error}", file=sys.stderr)
        raise SystemExit(1)
