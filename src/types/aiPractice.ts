import { LanguageCode } from "./vocabulary";

export type PracticeMode = "writing" | "speaking";

export interface AiPracticeRequest {
  cardId: string;
  mode: PracticeMode;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  promptText: string;
  expectedText: string;
  expectedExample: string;
  meaningLock: string;
  partOfSpeech: string;
  userAnswer: string;
  transcript?: string;
  cefrLevel?: string;
}

export interface AiPracticeResult {
  isCorrect: boolean;
  score: number;
  correctedAnswer: string;
  feedback: string;
  hint: string | null;
  grammarNotes: string[];
  acceptedAlternatives: string[];
}

export const emptyAiResult: AiPracticeResult = {
  isCorrect: false,
  score: 0,
  correctedAnswer: "",
  feedback: "Write an answer and try again.",
  hint: null,
  grammarNotes: [],
  acceptedAlternatives: []
};
