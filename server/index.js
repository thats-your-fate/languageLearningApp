require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const express = require("express");
const multer = require("multer");
const OpenAI = require("openai");

const app = express();
const port = process.env.PORT || 3001;
const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.use(express.json({ limit: "1mb" }));

app.get("/api/ai-practice/health", (_req, res) => {
  res.json({
    ok: true,
    openAiConfigured: Boolean(client)
  });
});

app.post("/api/ai-practice/evaluate", async (req, res) => {
  const request = req.body || {};
  const missing = validateEvaluateRequest(request);

  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
  }

  const userAnswer = String(request.transcript || request.userAnswer || "").trim();
  if (!userAnswer) {
    return res.json(emptyAnswerResult(request));
  }

  if (!client) {
    return res.json(fallbackResult(request));
  }

  try {
    return res.json(await evaluateWithOpenAI(request, userAnswer));
  } catch (error) {
    console.error(error);
    return res.json(fallbackResult(request));
  }
});

app.post("/api/ai-practice/evaluate-stream", async (req, res) => {
  const request = req.body || {};
  const missing = validateEvaluateRequest(request);

  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
  }

  res.writeHead(200, {
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Content-Type": "text/event-stream; charset=utf-8",
    "X-Accel-Buffering": "no"
  });

  let closed = false;
  res.on("close", () => {
    closed = true;
  });
  res.on("error", () => {
    closed = true;
  });

  const send = (event, data) => {
    if (closed || res.writableEnded) return false;
    try {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      return true;
    } catch {
      closed = true;
      return false;
    }
  };

  const userAnswer = String(request.transcript || request.userAnswer || "").trim();
  if (!userAnswer) {
    send("final", emptyAnswerResult(request));
    res.end();
    return;
  }

  if (!client) {
    send("final", fallbackResult(request));
    res.end();
    return;
  }

  let streamedFeedback = "";

  try {
    let earlyResult = null;
    send("score", quickScoreResult(request, userAnswer));
    const finalResultPromise = evaluateWithOpenAI(request, userAnswer).then((result) => {
      earlyResult = result;
      send("score", result);
      return result;
    });
    const stream = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      temperature: 0.35,
      stream: true,
      messages: buildStreamingFeedbackMessages(request, userAnswer)
    });

    for await (const part of stream) {
      const token = part.choices[0]?.delta?.content || "";
      if (!token) continue;
      streamedFeedback += token;
      if (!send("token", { token })) break;
    }

    const finalResult = earlyResult || (await finalResultPromise);
    if (streamedFeedback.trim()) {
      finalResult.feedback = streamedFeedback.trim();
    }
    send("final", finalResult);
  } catch (error) {
    console.error(error);
    send("final", { ...fallbackResult(request), offlineReason: "AI streaming failed." });
  } finally {
    if (!closed && !res.writableEnded) {
      res.end();
    }
  }
});

app.post("/api/ai-practice/transcribe", upload.single("audio"), async (req, res) => {
  if (!client) {
    return res.status(503).json({ error: "OpenAI API key is not configured." });
  }

  try {
    if (!req.file) {
      return res.status(400).json({ error: "Missing audio file." });
    }

    const file = await OpenAI.toFile(req.file.buffer, req.file.originalname || "speech.m4a", {
      type: req.file.mimetype || "audio/m4a"
    });
    const transcription = await client.audio.transcriptions.create({
      file,
      model: process.env.OPENAI_TRANSCRIBE_MODEL || "whisper-1",
      language: toWhisperLanguage(req.body.language)
    });

    return res.json({ transcript: transcription.text || "" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Speech transcription failed." });
  }
});

app.post("/api/ai-practice/explain", async (req, res) => {
  const request = req.body || {};
  const required = ["sourceLanguage", "targetLanguage", "expectedText", "userAnswer", "feedback"].filter((field) => !request[field]);
  if (required.length > 0) {
    return res.status(400).json({ error: `Missing fields: ${required.join(", ")}` });
  }

  if (!client) {
    return res.json({
      explanation: fallbackExplain(request),
      source: "fallback"
    });
  }

  try {
    const sourceLanguageName = languageName(request.sourceLanguage);
    const targetLanguageName = languageName(request.targetLanguage);
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            `You are a concise language tutor. You must write the explanation in ${sourceLanguageName} only. Return only valid JSON.`
        },
        {
          role: "user",
          content: JSON.stringify({
            instructions: [
              "Return JSON with one key: explanation.",
              `Write the explanation in ${sourceLanguageName} only.`,
              `Do not write in ${targetLanguageName}, except for quoted target-language words or short examples.`,
              "If the feedback text is in another language, translate and explain it for the learner.",
              "Explain the previous feedback simply and clearly.",
              "Do not add new scoring.",
              "Keep A1 explanations short and practical."
            ],
            sourceLanguage: request.sourceLanguage,
            sourceLanguageName,
            targetLanguage: request.targetLanguage,
            targetLanguageName,
            expectedVocabularyItem: request.expectedText,
            userAnswer: request.userAnswer,
            feedback: request.feedback,
            correctedAnswer: request.correctedAnswer || null,
            grammarNotes: request.grammarNotes || [],
            cefrLevel: request.cefrLevel || null
          })
        }
      ]
    });
    const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
    return res.json({
      explanation: stringOr(parsed.explanation, request.feedback),
      source: "ai"
    });
  } catch (error) {
    console.error(error);
    return res.json({
      explanation: fallbackExplain(request),
      source: "fallback"
    });
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
    acceptedAlternatives: Array.isArray(result.acceptedAlternatives) ? result.acceptedAlternatives.map(String) : [],
    source: "ai"
  };
}

async function evaluateWithOpenAI(request, userAnswer) {
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: buildStructuredEvaluationMessages(request, userAnswer)
  });

  const raw = response.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(raw);
  return sanitizeResult(parsed, request);
}

function buildStructuredEvaluationMessages(request, userAnswer) {
  return [
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
        ...requestPayload(request, userAnswer)
      })
    }
  ];
}

function buildStreamingFeedbackMessages(request, userAnswer) {
  const languageInstruction =
    request.cefrLevel === "A1"
      ? "Write in the learner's source language."
      : "Write primarily in the target language, but keep it clear.";

  return [
    {
      role: "system",
      content:
        "You are a friendly language tutor. Stream only learner-facing feedback text. Do not output JSON, labels, markdown headings, scores, or hidden policy."
    },
    {
      role: "user",
      content: JSON.stringify({
        instructions: [
          languageInstruction,
          "Be encouraging and practical.",
          "Evaluate whether the expected vocabulary item, or a correct inflected/conjugated form, is used naturally in the user's own sentence.",
          "Do not require matching the reference example.",
          "Do not mention that you are checking only the target word.",
          "If correct, explain briefly why the sentence works, including a useful grammar point when relevant.",
          "If not correct, explain what to change and give one simple correction.",
          "Keep it to one short paragraph for A1, two short paragraphs maximum otherwise."
        ],
        ...requestPayload(request, userAnswer)
      })
    }
  ];
}

function requestPayload(request, userAnswer) {
  return {
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
  };
}

function validateEvaluateRequest(request) {
  return ["cardId", "mode", "sourceLanguage", "targetLanguage", "expectedText", "expectedExample"].filter(
    (field) => !request[field]
  );
}

function emptyAnswerResult(request) {
  return {
    isCorrect: false,
    score: 0,
    correctedAnswer: request.expectedExample,
    feedback: "Try one short answer.",
    hint: `Use: ${request.expectedText}`,
    grammarNotes: [],
    acceptedAlternatives: [],
    source: "fallback"
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
    acceptedAlternatives: [request.expectedText],
    source: "fallback"
  };
}

function quickScoreResult(request, userAnswer) {
  const answerWords = normalizeWords(userAnswer);
  const expectedWords = normalizeWords(request.expectedText);
  const hasExpectedWord =
    expectedWords.length > 0 &&
    expectedWords.every((expected) =>
      answerWords.some((word) => word === expected || word.startsWith(expected) || expected.startsWith(word))
    );

  return sanitizeResult(
    {
      isCorrect: hasExpectedWord,
      score: hasExpectedWord ? 1 : 0.4,
      correctedAnswer: request.expectedExample,
      feedback: "",
      grammarNotes: [],
      acceptedAlternatives: [request.expectedText]
    },
    request
  );
}

function normalizeWords(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .match(/[a-z0-9]+/g) || [];
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

function fallbackExplain(request) {
  const copy = {
    en: `In simple terms: ${request.feedback}`,
    de: `Einfach gesagt: ${request.feedback}`,
    "pt-BR": `Em termos simples: ${request.feedback}`,
    it: `In parole semplici: ${request.feedback}`,
    es: `En palabras simples: ${request.feedback}`,
    fr: `En termes simples : ${request.feedback}`
  };
  return copy[request.sourceLanguage] || copy.en;
}

function languageName(language) {
  const names = {
    en: "English",
    de: "German",
    "pt-BR": "Portuguese (Brazil)",
    it: "Italian",
    es: "Spanish",
    fr: "French"
  };
  return names[language] || "English";
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function stringOr(value, fallback) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function toWhisperLanguage(language) {
  const map = {
    en: "en",
    de: "de",
    "pt-BR": "pt",
    it: "it",
    es: "es",
    fr: "fr"
  };
  return map[language] || undefined;
}
