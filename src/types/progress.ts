import { CEFRLevel } from "./vocabulary";

export type DifficultyGrade = "again" | "hard" | "good" | "easy";

export interface CardProgress {
  cardId: string;
  reviews: number;
  correctReviews: number;
  lastReviewedAt: string | null;
  dueAt: string;
  grade: DifficultyGrade | null;
  gradeCounts: Record<DifficultyGrade, number>;
  reviewHistory: {
    grade: DifficultyGrade;
    reviewedAt: string;
  }[];
  status: "new" | "learning" | "known" | "weak";
}

export interface ProgressSummary {
  knownWords: number;
  learningWords: number;
  dueCards: number;
  reviewsCompleted: number;
  accuracy: number;
  weakCardIds: string[];
  levelProgress: Partial<Record<CEFRLevel, number>>;
}
