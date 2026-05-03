import vocabulary from "../data/vocabulary.json";
import { CEFRLevel, LanguageCode, PracticeCardView, StarterLevel, VocabularyCard } from "../types/vocabulary";

const cards = vocabulary as VocabularyCard[];

export function getAllCards(): VocabularyCard[] {
  return cards;
}

export function getCardById(id: string): VocabularyCard | undefined {
  return cards.find((card) => card.id === id);
}

export function getPracticeCards(sourceLanguage: LanguageCode, targetLanguage: LanguageCode): PracticeCardView[] {
  return cards
    .filter((card) => card.translations[sourceLanguage] && card.translations[targetLanguage])
    .map((card) => toPracticeCardView(card, sourceLanguage, targetLanguage));
}

export function getCardsByLevel(level: CEFRLevel): VocabularyCard[] {
  return cards.filter((card) => card.level === level);
}

export function searchCards(
  query: string,
  sourceLanguage: LanguageCode,
  targetLanguage: LanguageCode,
  level?: CEFRLevel | "All",
  category?: string
): PracticeCardView[] {
  const normalizedQuery = normalize(query);

  return getPracticeCards(sourceLanguage, targetLanguage).filter((card) => {
    const matchesLevel = !level || level === "All" || card.level === level;
    const matchesCategory = !category || category === "All" || card.category === category;
    const haystack = normalize(
      `${card.sourceText} ${card.targetText} ${card.category} ${card.partOfSpeech} ${card.meaningLock}`
    );
    return matchesLevel && matchesCategory && (!normalizedQuery || haystack.includes(normalizedQuery));
  });
}

export function getRandomCard(
  sourceLanguage: LanguageCode,
  targetLanguage: LanguageCode,
  level?: CEFRLevel | "All"
): PracticeCardView {
  const filtered = getPracticeCards(sourceLanguage, targetLanguage).filter(
    (card) => !level || level === "All" || card.level === level
  );
  const pool = filtered.length > 0 ? filtered : getPracticeCards(sourceLanguage, targetLanguage);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getCategories(): string[] {
  return Array.from(new Set(cards.map((card) => card.category))).sort((a, b) => a.localeCompare(b));
}

export function getAvailableStarterLevels(): StarterLevel[] {
  const order: StarterLevel[] = ["A1", "A2", "B1"];
  const available = new Set(cards.map((card) => card.level));
  return order.filter((level) => available.has(level));
}

export function toPracticeCardView(
  card: VocabularyCard,
  sourceLanguage: LanguageCode,
  targetLanguage: LanguageCode
): PracticeCardView {
  const source = card.translations[sourceLanguage] ?? card.english;
  const target = card.translations[targetLanguage] ?? card.english;

  return {
    id: card.id,
    level: card.level,
    category: card.category,
    partOfSpeech: card.partOfSpeech,
    sourceLanguage,
    targetLanguage,
    sourceText: source.text,
    targetText: target.text,
    sourceExample: source.example,
    targetExample: target.example,
    meaningLock: card.meaningLock,
    raw: card
  };
}

export function shuffleCards<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s']/gu, "")
    .replace(/\s+/g, " ");
}

export function isCloseAnswer(userAnswer: string, expectedAnswer: string): boolean {
  const answer = normalize(userAnswer);
  const expected = normalize(expectedAnswer);
  if (!answer) {
    return false;
  }
  if (answer === expected || answer.includes(expected) || expected.includes(answer)) {
    return true;
  }

  const expectedWords = expected.split(" ");
  const answerWords = answer.split(" ");
  const overlap = expectedWords.filter((word) => answerWords.includes(word)).length;
  return expectedWords.length > 1 && overlap / expectedWords.length >= 0.65;
}
