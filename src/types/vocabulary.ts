export type LanguageCode = "en" | "de" | "pt-BR" | "it" | "es" | "fr";

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1";

export type StarterLevel = "A1" | "A2" | "B1";

export interface VocabularyTranslation {
  text: string;
  example: string;
}

export interface VocabularyCard {
  id: string;
  level: CEFRLevel;
  category: string;
  subcategory?: string;
  type: string;
  partOfSpeech: string;
  english: VocabularyTranslation;
  meaningLock: string;
  translations: Partial<Record<LanguageCode, VocabularyTranslation>>;
  qa?: {
    checked?: boolean;
    suitableForLevel?: boolean;
    notes?: string;
  };
}

export interface PracticeCardView {
  id: string;
  level: CEFRLevel;
  category: string;
  partOfSpeech: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  sourceText: string;
  targetText: string;
  sourceExample: string;
  targetExample: string;
  meaningLock: string;
  raw: VocabularyCard;
}

export type AppSettings = {
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  activeLevel: StarterLevel | "All";
  themeMode: "system" | "dark" | "light";
  aiFeedbackLanguage: "source" | "target" | "mixed";
  autoPlayAudio: boolean;
  enableAiExplanations: boolean;
  hasCompletedOnboarding: boolean;
};

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: "English",
  de: "German",
  "pt-BR": "Portuguese",
  it: "Italian",
  es: "Spanish",
  fr: "French"
};

export const SUPPORTED_LANGUAGES: LanguageCode[] = ["en", "de", "pt-BR", "it", "es", "fr"];

export const STARTER_LEVELS: StarterLevel[] = ["A1", "A2", "B1"];
