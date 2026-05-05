import { NativeModules, Platform } from "react-native";
import { AiPracticeRequest, AiPracticeResult } from "../types/aiPractice";
import { LanguageCode, PracticeCardView } from "../types/vocabulary";
import { isCloseAnswer } from "./vocabularyService";

const API_PATH = "/api/ai-practice/evaluate";
const STREAM_API_PATH = "/api/ai-practice/evaluate-stream";
const EXPLAIN_API_PATH = "/api/ai-practice/explain";
const configuredApiUrl = process.env.EXPO_PUBLIC_AI_API_URL;

export async function evaluateWritingAnswer(
  card: PracticeCardView,
  userAnswer: string,
  targetLanguage: LanguageCode
): Promise<AiPracticeResult> {
  return evaluate(buildRequest(card, "writing", userAnswer, targetLanguage));
}

export async function evaluateWritingAnswerStream(
  card: PracticeCardView,
  userAnswer: string,
  targetLanguage: LanguageCode,
  onToken: (token: string) => void,
  onPartialResult?: (result: AiPracticeResult) => void
): Promise<AiPracticeResult> {
  return evaluateStream(buildRequest(card, "writing", userAnswer, targetLanguage), onToken, onPartialResult);
}

export async function evaluateSpeakingAnswer(
  card: PracticeCardView,
  transcript: string,
  targetLanguage: LanguageCode
): Promise<AiPracticeResult> {
  return evaluate(buildRequest(card, "speaking", transcript, targetLanguage, transcript));
}

export async function evaluateSpeakingAnswerStream(
  card: PracticeCardView,
  transcript: string,
  targetLanguage: LanguageCode,
  onToken: (token: string) => void,
  onPartialResult?: (result: AiPracticeResult) => void
): Promise<AiPracticeResult> {
  return evaluateStream(buildRequest(card, "speaking", transcript, targetLanguage, transcript), onToken, onPartialResult);
}

export async function explainAiFeedbackInSourceLanguage(
  card: PracticeCardView,
  userAnswer: string,
  result: AiPracticeResult
): Promise<string> {
  const apiUrl = getAiApiUrl(EXPLAIN_API_PATH);
  if (!apiUrl) {
    return result.feedback;
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceLanguage: card.sourceLanguage,
        targetLanguage: card.targetLanguage,
        expectedText: card.targetText,
        userAnswer,
        feedback: result.feedback,
        correctedAnswer: result.correctedAnswer,
        grammarNotes: result.grammarNotes,
        cefrLevel: card.level
      })
    });
    if (!response.ok) {
      throw new Error(`Explain backend failed: ${response.status}`);
    }
    const payload = (await response.json()) as { explanation?: string };
    return payload.explanation || result.feedback;
  } catch {
    return result.feedback;
  }
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
      acceptedAlternatives: [],
      source: "fallback"
    };
  }

  try {
    const apiUrl = getAiApiUrl(API_PATH);
    if (!apiUrl) {
      throw new Error("AI backend URL is not configured.");
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`AI backend failed: ${response.status}`);
    }

    return sanitizeResult((await response.json()) as Partial<AiPracticeResult>, request);
  } catch (error) {
    return localFallback(request, error instanceof Error ? error.message : "AI backend request failed.");
  }
}

async function evaluateStream(
  request: AiPracticeRequest,
  onToken: (token: string) => void,
  onPartialResult?: (result: AiPracticeResult) => void
): Promise<AiPracticeResult> {
  if (!request.userAnswer.trim()) {
    return {
      isCorrect: false,
      score: 0,
      correctedAnswer: request.expectedExample,
      feedback: "Try one short sentence.",
      hint: `Use: ${request.expectedText}`,
      grammarNotes: [],
      acceptedAlternatives: [],
      source: "fallback"
    };
  }

  try {
    const apiUrl = getAiApiUrl(STREAM_API_PATH);
    if (!apiUrl) {
      throw new Error("AI backend URL is not configured.");
    }

    return await postSse(apiUrl, request, onToken, onPartialResult);
  } catch (error) {
    return localFallback(request, error instanceof Error ? error.message : "AI backend request failed.");
  }
}

function postSse(
  apiUrl: string,
  request: AiPracticeRequest,
  onToken: (token: string) => void,
  onPartialResult?: (result: AiPracticeResult) => void
): Promise<AiPracticeResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let processedLength = 0;
    let pending = "";
    let finalResult: AiPracticeResult | null = null;
    const processResponse = () => {
      pending += xhr.responseText.slice(processedLength);
      processedLength = xhr.responseText.length;
      const blocks = pending.split("\n\n");
      pending = blocks.pop() ?? "";
      for (const event of parseSseEvents(blocks.join("\n\n"))) {
        if (event.type === "token") {
          onToken(String(event.data.token ?? ""));
        }
        if (event.type === "final") {
          finalResult = sanitizeResult(event.data as Partial<AiPracticeResult>, request);
        }
        if (event.type === "score") {
          const nextResult = sanitizeResult(event.data as Partial<AiPracticeResult>, request);
          finalResult = nextResult;
          onPartialResult?.(nextResult);
        }
      }
    };

    xhr.open("POST", apiUrl);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED && xhr.status >= 400) {
        reject(new Error(`AI backend failed: ${xhr.status}`));
      }
    };

    xhr.onprogress = () => {
      processResponse();
    };

    xhr.onerror = () => reject(new Error("AI streaming request failed."));
    xhr.ontimeout = () => reject(new Error("AI streaming request timed out."));
    xhr.onload = () => {
      processResponse();
      for (const event of parseSseEvents(pending)) {
        if (event.type === "token") {
          onToken(String(event.data.token ?? ""));
        }
        if (event.type === "final") {
          finalResult = sanitizeResult(event.data as Partial<AiPracticeResult>, request);
        }
        if (event.type === "score") {
          const nextResult = sanitizeResult(event.data as Partial<AiPracticeResult>, request);
          finalResult = nextResult;
          onPartialResult?.(nextResult);
        }
      }
      if (xhr.status >= 400) {
        reject(new Error(`AI backend failed: ${xhr.status}`));
        return;
      }
      resolve(finalResult ?? localFallback(request, "AI stream ended without a final result."));
    };

    xhr.send(JSON.stringify(request));
  });
}

function parseSseEvents(chunk: string) {
  return chunk
    .split("\n\n")
    .map((block) => {
      const eventLine = block.split("\n").find((line) => line.startsWith("event: "));
      const dataLine = block.split("\n").find((line) => line.startsWith("data: "));
      if (!eventLine || !dataLine) return null;
      try {
        return {
          type: eventLine.replace("event: ", "").trim(),
          data: JSON.parse(dataLine.replace("data: ", ""))
        };
      } catch {
        return null;
      }
    })
    .filter((event): event is { type: string; data: Record<string, unknown> } => Boolean(event));
}

export function getAiApiUrl(path = "") {
  if (configuredApiUrl) {
    return `${configuredApiUrl.replace(/\/$/, "")}${path}`;
  }

  const host = getExpoHost();
  return host ? `http://${host}:3001${path}` : null;
}

function getExpoHost() {
  if (Platform.OS === "web" && typeof window !== "undefined" && window.location.hostname) {
    return window.location.hostname;
  }

  const scriptUrl = (NativeModules.SourceCode as { scriptURL?: string } | undefined)?.scriptURL;
  const match = scriptUrl?.match(/\/\/([^/:]+)(?::\d+)?\//);
  return match?.[1] ?? null;
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

function localFallback(request: AiPracticeRequest, offlineReason?: string): AiPracticeResult {
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
    acceptedAlternatives: [request.expectedText],
    source: "fallback",
    offlineReason
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
    acceptedAlternatives: Array.isArray(result.acceptedAlternatives) ? result.acceptedAlternatives : [],
    source: result.source === "fallback" ? "fallback" : "ai",
    offlineReason: result.offlineReason
  };
}
