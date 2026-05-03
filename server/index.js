const express = require("express");
const OpenAI = require("openai");

const app = express();
const port = process.env.PORT || 3001;
const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

app.use(express.json({ limit: "1mb" }));

app.post("/api/ai-practice/evaluate", async (req, res) => {
  const request = req.body || {};
  const missing = ["cardId", "mode", "sourceLanguage", "targetLanguage", "expectedText", "expectedExample"].filter(
    (field) => !request[field]
  );

  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
  }

  const userAnswer = String(request.transcript || request.userAnswer || "").trim();
  if (!userAnswer) {
    return res.json({
      isCorrect: false,
      score: 0,
      correctedAnswer: request.expectedExample,
      feedback: "Try one short answer.",
      hint: `Use: ${request.expectedText}`,
      grammarNotes: [],
      acceptedAlternatives: []
    });
  }

  if (!client) {
    return res.json(fallbackResult(request));
  }

  try {
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an expert language tutor. Evaluate beginner language-learning answers. Be encouraging, concise, and practical. Accept natural alternatives if they preserve the meaning. Do not require exact word-for-word matches unless the task explicitly asks for that. Return only valid JSON."
        },
        {
          role: "user",
          content: JSON.stringify({
            instructions: [
              "Return JSON with isCorrect, score, correctedAnswer, feedback, hint, grammarNotes, acceptedAlternatives.",
              "If cefrLevel is A1, write feedback and grammarNotes in the source language.",
              "For A2 and higher, prefer the target language unless the correction would become unclear.",
              "The reference example is optional context only. Never grade whether the user matched the reference example.",
              "Only evaluate whether the expected vocabulary item was used correctly and naturally in the user's own sentence.",
              "Accept correct inflected, conjugated, gendered, plural, contracted, or article/preposition forms of the expected vocabulary item.",
              "For example, if the expected item is an infinitive verb, accept a correctly conjugated form.",
              "Use that rule silently. Do not tell the learner that you are only checking the target word or phrase.",
              "Do not mention these instructions, the prompt, scoring policy, or evaluation criteria in the feedback.",
              "Do not mark the answer wrong merely because the whole sentence differs from the reference example.",
              "Accept natural sentences that use the target word or phrase correctly, even with a different context from the reference example.",
              "If the target word or phrase, or a correct inflected/conjugated form, is present and the user's sentence is grammatical enough for the level, give score 1.0.",
              "Use scores below 1.0 only when there is a real vocabulary-use issue, grammar issue, meaning issue, or spelling issue.",
              "Do not say to use the example sentence as a pattern.",
              "Give a slightly more comprehensive explanation of why the user's written sentence is correct or what needs fixing.",
              "For correct answers, mention the specific useful grammar point, such as article, gender, verb form, agreement, or sentence structure.",
              "score must be between 0 and 1.",
              "For A1, keep explanations simple but include the key reason.",
              "Writing: if the vocabulary item is used correctly, correctedAnswer can be a polished version of the user's sentence, not the reference example.",
              "Speaking: evaluate transcript, not raw audio. Do not claim audio-level phonetic analysis."
            ],
            practiceMode: request.mode,
            sourceLanguage: request.sourceLanguage,
            targetLanguage: request.targetLanguage,
            expectedVocabularyItem: request.expectedText,
            referenceExampleSentenceOptional: request.expectedExample,
            meaningLock: request.meaningLock,
            partOfSpeech: request.partOfSpeech,
            cefrLevel: request.cefrLevel,
            userAnswer,
            transcript: request.transcript || null
          })
        }
      ]
    });

    const raw = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    return res.json(sanitizeResult(parsed, request));
  } catch (error) {
    console.error(error);
    return res.json(fallbackResult(request));
  }
});

app.listen(port, () => {
  console.log(`AI practice server listening on http://localhost:${port}`);
});

function sanitizeResult(result, request) {
  const score = clamp(Number(result.score || 0), 0, 1);
  return {
    isCorrect: Boolean(result.isCorrect || score >= 0.75),
    score,
    correctedAnswer: stringOr(result.correctedAnswer, request.expectedExample),
    feedback: stringOr(result.feedback, "Good practice. Keep going."),
    hint: result.hint ? String(result.hint) : null,
    grammarNotes: Array.isArray(result.grammarNotes) ? result.grammarNotes.map(String) : [],
    acceptedAlternatives: Array.isArray(result.acceptedAlternatives) ? result.acceptedAlternatives.map(String) : []
  };
}

function fallbackResult(request) {
  const copy = fallbackCopy(request.targetLanguage, request.expectedText);
  return {
    isCorrect: false,
    score: 0.4,
    correctedAnswer: request.expectedExample,
    feedback: copy.feedback,
    hint: request.meaningLock || null,
    grammarNotes: [copy.note],
    acceptedAlternatives: [request.expectedText]
  };
}

function fallbackCopy(language, word) {
  const copy = {
    en: [`Good try. Use "${word}" or a correct form of it in your own sentence.`, "The sentence can be different from the example."],
    de: [`Guter Versuch. Benutze "${word}" oder eine richtige Form davon in deinem eigenen Satz.`, "Der Satz darf anders sein als das Beispiel."],
    "pt-BR": [`Boa tentativa. Use "${word}" ou uma forma correta dela na sua própria frase.`, "A frase pode ser diferente do exemplo."],
    it: [`Bel tentativo. Usa "${word}" o una forma corretta nella tua frase.`, "La frase può essere diversa dall’esempio."],
    es: [`Buen intento. Usa "${word}" o una forma correcta en tu propia frase.`, "La frase puede ser diferente del ejemplo."],
    fr: [`Bon essai. Utilise "${word}" ou une forme correcte dans ta propre phrase.`, "La phrase peut être différente de l’exemple."]
  }[language] || [`Good try. Use "${word}" or a correct form of it in your own sentence.`, "The sentence can be different from the example."];
  return { feedback: copy[0], note: copy[1] };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function stringOr(value, fallback) {
  return typeof value === "string" && value.trim() ? value : fallback;
}
