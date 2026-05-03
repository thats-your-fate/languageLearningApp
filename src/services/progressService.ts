import AsyncStorage from "@react-native-async-storage/async-storage";
import { CardProgress, DifficultyGrade, ProgressSummary } from "../types/progress";
import { CEFRLevel, VocabularyCard } from "../types/vocabulary";
import { getAllCards } from "./vocabularyService";

const PROGRESS_KEY = "lighthouse:progress";
let memoryProgress: Record<string, CardProgress> = {};

export async function getProgressSummary(cards: VocabularyCard[] = getAllCards()): Promise<ProgressSummary> {
  const progress = await getAllProgress();
  const progressValues = Object.values(progress);
  const now = new Date();
  const reviewsCompleted = progressValues.reduce((sum, card) => sum + card.reviews, 0);
  const correctReviews = progressValues.reduce((sum, card) => sum + card.correctReviews, 0);
  const levelProgress: Partial<Record<CEFRLevel, number>> = {};

  cards.forEach((card) => {
    const levelCards = cards.filter((item) => item.level === card.level);
    const knownInLevel = levelCards.filter((item) => progress[item.id]?.status === "known").length;
    levelProgress[card.level] = levelCards.length ? knownInLevel / levelCards.length : 0;
  });

  return {
    knownWords: progressValues.filter((card) => card.status === "known").length,
    learningWords: progressValues.filter((card) => card.status === "learning").length,
    dueCards: getDueCards(cards, progress, now).length,
    reviewsCompleted,
    accuracy: reviewsCompleted > 0 ? correctReviews / reviewsCompleted : 0,
    weakCardIds: progressValues.filter((card) => card.status === "weak").map((card) => card.cardId),
    levelProgress
  };
}

export async function getCardProgress(cardId: string): Promise<CardProgress | null> {
  const progress = await getAllProgress();
  return progress[cardId] ?? null;
}

export async function getAllProgress(): Promise<Record<string, CardProgress>> {
  try {
    const raw = await AsyncStorage.getItem(PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, CardProgress>) : {};
  } catch {
    return memoryProgress;
  }
}

export async function recordReview(cardId: string, grade: DifficultyGrade): Promise<CardProgress> {
  const progress = await getAllProgress();
  const now = new Date();
  const current = progress[cardId] ?? createInitialProgress(cardId, now);
  const correct = grade === "good" || grade === "easy";
  const reviews = current.reviews + 1;
  const correctReviews = current.correctReviews + (correct ? 1 : 0);
  const status = grade === "again" ? "weak" : grade === "good" || grade === "easy" ? "known" : "learning";
  const gradeCounts = {
    ...createEmptyGradeCounts(),
    ...(current.gradeCounts ?? {})
  };
  gradeCounts[grade] += 1;
  const reviewedAt = now.toISOString();
  const next: CardProgress = {
    cardId,
    reviews,
    correctReviews,
    lastReviewedAt: reviewedAt,
    dueAt: getNextDueDate(now, grade).toISOString(),
    grade,
    gradeCounts,
    reviewHistory: [...(current.reviewHistory ?? []), { grade, reviewedAt }],
    status
  };

  progress[cardId] = next;
  await saveAllProgress(progress);
  return next;
}

export function getDueCards<T extends { id: string }>(
  cards: T[],
  progress: Record<string, CardProgress> = memoryProgress,
  now = new Date()
): T[] {
  return cards.filter((card) => {
    const cardProgress = progress[card.id];
    return !cardProgress || new Date(cardProgress.dueAt) <= now;
  });
}

export function isKnownProgress(progress?: CardProgress | null): boolean {
  return progress?.status === "known" || progress?.grade === "good" || progress?.grade === "easy";
}

export function isWeakProgress(progress?: CardProgress | null): boolean {
  return progress?.status === "weak" || progress?.grade === "again";
}

export async function resetProgress(): Promise<void> {
  memoryProgress = {};
  try {
    await AsyncStorage.removeItem(PROGRESS_KEY);
  } catch {
    memoryProgress = {};
  }
}

async function saveAllProgress(progress: Record<string, CardProgress>): Promise<void> {
  memoryProgress = progress;
  try {
    await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    memoryProgress = progress;
  }
}

function createInitialProgress(cardId: string, now: Date): CardProgress {
  return {
    cardId,
    reviews: 0,
    correctReviews: 0,
    lastReviewedAt: null,
    dueAt: now.toISOString(),
    grade: null,
    gradeCounts: createEmptyGradeCounts(),
    reviewHistory: [],
    status: "new"
  };
}

function createEmptyGradeCounts(): Record<DifficultyGrade, number> {
  return {
    again: 0,
    hard: 0,
    good: 0,
    easy: 0
  };
}

function getNextDueDate(now: Date, grade: DifficultyGrade): Date {
  const next = new Date(now);
  const delayMs: Record<DifficultyGrade, number> = {
    again: 0,
    hard: 24 * 60 * 60 * 1000,
    good: 3 * 24 * 60 * 60 * 1000,
    easy: 7 * 24 * 60 * 60 * 1000
  };
  next.setTime(now.getTime() + delayMs[grade]);
  return next;
}
