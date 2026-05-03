import { normalize } from "./vocabularyService";

export type AnswerFeedbackKind = "exact" | "close" | "fail";

export type AnswerFeedback = {
  kind: AnswerFeedbackKind;
  message: string;
  icon: "checkmark" | "alert" | "close";
};

const feedbackMessages: Record<AnswerFeedbackKind, string[]> = {
  exact: [
    "Great job.",
    "Perfect. Nice work.",
    "Exactly right.",
    "You got it."
  ],
  close: [
    "Close enough. Good job.",
    "Almost perfect. Nice work.",
    "Good. Just a small detail.",
    "That works. Keep going."
  ],
  fail: [
    "Try again.",
    "Not quite. Try once more.",
    "Almost. Look at the sentence again.",
    "Try again with the hint."
  ]
};

export function getAnswerFeedback(userAnswer: string, expectedAnswer: string): AnswerFeedback {
  const answer = normalize(userAnswer);
  const expected = normalize(expectedAnswer);

  if (answer && answer === expected) {
    return buildFeedback("exact");
  }

  if (isCloseButNotExact(answer, expected)) {
    return buildFeedback("close");
  }

  return buildFeedback("fail");
}

function buildFeedback(kind: AnswerFeedbackKind): AnswerFeedback {
  const messages = feedbackMessages[kind];
  return {
    kind,
    message: messages[Math.floor(Math.random() * messages.length)],
    icon: kind === "exact" ? "checkmark" : kind === "close" ? "alert" : "close"
  };
}

function isCloseButNotExact(answer: string, expected: string): boolean {
  if (!answer || !expected) {
    return false;
  }

  if (answer.includes(expected) || expected.includes(answer)) {
    return true;
  }

  const expectedWords = expected.split(" ");
  const answerWords = answer.split(" ");
  const overlap = expectedWords.filter((word) => answerWords.includes(word)).length;
  return expectedWords.length > 1 && overlap / expectedWords.length >= 0.65;
}
