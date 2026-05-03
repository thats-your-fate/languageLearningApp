import { AiPracticeRequest, AiPracticeResult } from "../types/aiPractice";
import { LanguageCode, PracticeCardView } from "../types/vocabulary";
import { isCloseAnswer } from "./vocabularyService";

const API_URL = "http://localhost:3001/api/ai-practice/evaluate";

export async function evaluateWritingAnswer(
  card: PracticeCardView,
  userAnswer: string,
  targetLanguage: LanguageCode
): Promise<AiPracticeResult> {
  return evaluate(buildRequest(card, "writing", userAnswer, targetLanguage));
}

export async function evaluateSpeakingAnswer(
  card: PracticeCardView,
  transcript: string,
  targetLanguage: LanguageCode
): Promise<AiPracticeResult> {
  return evaluate(buildRequest(card, "speaking", transcript, targetLanguage, transcript));
}

async function evaluate(request: AiPracticeRequest): Promise<AiPracticeResult> {
  if (!request.userAnswer.trim()) {
    return {
      isCorrect: false,
      score: 0,
      correctedAnswer: request.expectedExample,
      feedback: "Try one short sentence.",
      hint: `Use: ${request.expectedText}`,
      grammarNotes: [],
      acceptedAlternatives: []
    };
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`AI backend failed: ${response.status}`);
    }

    return sanitizeResult((await response.json()) as Partial<AiPracticeResult>, request);
  } catch {
    return localFallback(request);
  }
}

function buildRequest(
  card: PracticeCardView,
  mode: "writing" | "speaking",
  userAnswer: string,
  targetLanguage: LanguageCode,
  transcript?: string
): AiPracticeRequest {
  return {
    cardId: card.id,
    mode,
    sourceLanguage: card.sourceLanguage,
    targetLanguage,
    promptText: card.sourceExample,
    expectedText: card.targetText,
    expectedExample: card.targetExample,
    meaningLock: card.meaningLock,
    partOfSpeech: card.partOfSpeech,
    userAnswer,
    transcript,
    cefrLevel: card.level
  };
}

function localFallback(request: AiPracticeRequest): AiPracticeResult {
  const answer = request.transcript ?? request.userAnswer;
  const closeToWord = isCloseAnswer(answer, request.expectedText);
  const containsWord = includesVocabularyForm(answer, request.expectedText);
  const isCorrect = closeToWord || containsWord;
  const feedbackLanguage =
    request.cefrLevel === "A1" ? request.sourceLanguage : request.targetLanguage;
  const copy = fallbackCopy[feedbackLanguage] ?? fallbackCopy.en;

  return {
    isCorrect,
    score: containsWord || isCorrect ? 1 : 0.35,
    correctedAnswer: request.expectedExample,
    feedback: isCorrect ? copy.correct(request.expectedText) : copy.issue(request.expectedText),
    hint: isCorrect ? null : request.meaningLock,
    grammarNotes: containsWord || isCorrect ? [copy.whyCorrect] : [copy.note],
    acceptedAlternatives: [request.expectedText]
  };
}

const fallbackCopy: Record<
  string,
  {
    correct: (word: string) => string;
    issue: (word: string) => string;
    whyCorrect: string;
    note: string;
  }
> = {
  en: {
    correct: (word) => `Very good. You used "${word}" or a correct form of it naturally. Your sentence can be different from the example, and the word fits the sentence meaning.`,
    issue: (word) => `Good try. I do not clearly see "${word}" or a correct form of it in your sentence.`,
    whyCorrect: "The vocabulary item is used naturally in your sentence.",
    note: "Write your own simple sentence with the given word or a correct form of it."
  },
  de: {
    correct: (word) => `Sehr gut. Du hast "${word}" oder eine richtige Form davon natürlich benutzt. Dein Satz darf anders sein als das Beispiel, und das Wort passt zur Bedeutung.`,
    issue: (word) => `Guter Versuch. Ich sehe "${word}" oder eine richtige Form davon nicht klar in deinem Satz.`,
    whyCorrect: "Das Wort wird in deinem Satz natürlich benutzt.",
    note: "Schreibe deinen eigenen einfachen Satz mit dem Wort oder einer richtigen Form davon."
  },
  "pt-BR": {
    correct: (word) => `Muito bem. Você usou "${word}" ou uma forma correta dela naturalmente. A frase pode ser diferente do exemplo, e a palavra combina com o sentido da frase.`,
    issue: (word) => `Boa tentativa. Eu não vejo "${word}" ou uma forma correta dela claramente na sua frase.`,
    whyCorrect: "A palavra foi usada de forma natural na sua frase.",
    note: "Escreva sua própria frase simples com a palavra dada ou uma forma correta dela."
  },
  it: {
    correct: (word) => `Molto bene. Hai usato "${word}" o una forma corretta in modo naturale. La frase può essere diversa dall’esempio e la parola si adatta al significato.`,
    issue: (word) => `Bel tentativo. Non vedo chiaramente "${word}" o una forma corretta nella tua frase.`,
    whyCorrect: "La parola è usata in modo naturale nella tua frase.",
    note: "Scrivi una tua frase semplice con la parola data o una forma corretta."
  },
  es: {
    correct: (word) => `Muy bien. Usaste "${word}" o una forma correcta de manera natural. La frase puede ser diferente del ejemplo y la palabra encaja con el significado.`,
    issue: (word) => `Buen intento. No veo claramente "${word}" o una forma correcta en tu frase.`,
    whyCorrect: "La palabra se usa de forma natural en tu frase.",
    note: "Escribe tu propia frase simple con la palabra dada o una forma correcta."
  },
  fr: {
    correct: (word) => `Très bien. Tu as utilisé "${word}" ou une forme correcte naturellement. La phrase peut être différente de l’exemple, et le mot correspond bien au sens.`,
    issue: (word) => `Bon essai. Je ne vois pas clairement "${word}" ou une forme correcte dans ta phrase.`,
    whyCorrect: "Le mot est utilisé naturellement dans ta phrase.",
    note: "Écris ta propre phrase simple avec le mot donné ou une forme correcte."
  }
};

function includesVocabularyForm(answer: string, expectedText: string): boolean {
  const answerWords = normalizeWords(answer);
  const expectedWords = normalizeWords(expectedText);
  if (expectedWords.length === 0) return false;

  return expectedWords.every((expected) =>
    answerWords.some((word) => word === expected || word.startsWith(expected) || expected.startsWith(word))
  );
}

function normalizeWords(value: string): string[] {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .match(/[a-z0-9]+/g) ?? [];
}

function sanitizeResult(result: Partial<AiPracticeResult>, request: AiPracticeRequest): AiPracticeResult {
  const score = typeof result.score === "number" ? Math.max(0, Math.min(1, result.score)) : 0;
  return {
    isCorrect: Boolean(result.isCorrect ?? score >= 0.75),
    score,
    correctedAnswer: result.correctedAnswer || request.expectedExample,
    feedback: result.feedback || "Good practice. Keep going.",
    hint: result.hint ?? null,
    grammarNotes: Array.isArray(result.grammarNotes) ? result.grammarNotes : [],
    acceptedAlternatives: Array.isArray(result.acceptedAlternatives) ? result.acceptedAlternatives : []
  };
}
