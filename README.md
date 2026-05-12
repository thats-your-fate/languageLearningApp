# Lighthouse

Expo + React Native + TypeScript language-learning app for vocabulary, sentence practice, spaced repetition, and optional AI tutor feedback.

## Run

Install Node.js first if it is not already available, then run:

```sh
npm install
npm run start
```

Useful scripts:

```sh
npm run ios
npm run android
npm run typecheck
```

## AI Backend

The React Native app does not contain an OpenAI API key. For the example backend:

```sh
cd server
npm install
OPENAI_API_KEY=... npm start
```

The mobile AI practice service posts to `http://localhost:3001/api/ai-practice/evaluate` and safely falls back if the backend is unavailable.

## Generate Vocabulary From CSV

The script [scripts/populate_vocabulary_from_wordlist.py](/Users/yaro/projects/language-flashcards/scripts/populate_vocabulary_from_wordlist.py) reads `/Users/yaro/projects/wordlist.csv` and generates app-ready cards with OpenAI.

```sh
python3 -m pip install -r scripts/requirements.txt
export OPENAI_API_KEY=...
python3 scripts/populate_vocabulary_from_wordlist.py --limit 50 --overwrite
```

Omit `--limit` to process the whole CSV. The script writes a checkpoint at `scripts/.vocabulary_generation_checkpoint.json` so long runs can resume.

## QA Vocabulary

The script [scripts/qa_vocabulary_with_openai.py](/home/yaro/projects/language-flashcards/scripts/qa_vocabulary_with_openai.py) checks translations and examples with OpenAI. By default it fixes wrong or unnatural phrasing immediately in `src/data/vocabulary.json`, writing after each checked card.

```sh
python3 scripts/qa_vocabulary_with_openai.py --limit 20
python3 scripts/qa_vocabulary_with_openai.py --check-only --limit 20
python3 scripts/qa_vocabulary_with_openai.py --output src/data/vocabulary.fixed.json
```

The script writes a report at `scripts/vocabulary_qa_report.json` and a checkpoint at `scripts/.vocabulary_qa_checkpoint.json`.

## Structure

- `src/data/vocabulary.json`: local Oxford-style starter vocabulary.
- `src/services`: vocabulary, progress, settings, TTS, speech placeholder, AI practice client.
- `src/screens`: Home, Word List, Card Detail, Practice Hub, Flashcards, Sentence Practice, AI Writing, AI Speaking, Stats, Settings.
- `server/index.js`: Express endpoint example for AI evaluation.
