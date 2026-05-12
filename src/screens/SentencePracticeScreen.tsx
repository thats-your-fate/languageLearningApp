import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, useColorScheme, View } from "react-native";
import { AnswerFeedbackBanner } from "../components/AnswerFeedbackBanner";
import { AppButton } from "../components/AppButton";
import { Screen } from "../components/Screen";
import { useI18n } from "../i18n";
import { RootStackParamList } from "../navigation/AppNavigator";
import { playFailAlert, playSuccessAlert } from "../services/alertSoundService";
import { AnswerFeedback, getAnswerFeedback } from "../services/feedbackService";
import { getAllProgress } from "../services/progressService";
import { getSettings } from "../services/settingsService";
import { speak } from "../services/ttsService";
import { getPracticeCards, normalize, shuffleCards } from "../services/vocabularyService";
import { useAppTheme } from "../theme";
import { CardProgress } from "../types/progress";
import { AppSettings, PracticeCardView } from "../types/vocabulary";

type TaskType = "choose" | "fill";

type FillTask = {
  promptSentence: string;
  revealedSentence: string;
  expectedAnswers: string[];
  highlightedAnswer: string;
  hasGap: boolean;
};

const flagByLanguage: Record<string, string> = {
  "pt-BR": "🇧🇷",
  en: "🇬🇧",
  de: "🇩🇪",
  es: "🇪🇸",
  fr: "🇫🇷",
  it: "🇮🇹"
};

type Props = NativeStackScreenProps<RootStackParamList, "SentencePractice">;

export function SentencePracticeScreen({ navigation, route }: Props) {
  const theme = useAppTheme();
  const { t } = useI18n();
  const successSpeechTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [cards, setCards] = useState<PracticeCardView[]>([]);
  const [index, setIndex] = useState(0);
  const [taskType, setTaskType] = useState<TaskType>("choose");
  const [typed, setTyped] = useState("");
  const [selected, setSelected] = useState("");
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setIndex(0);
    setTaskType("choose");
    setTyped("");
    setSelected("");
    setFeedback(null);
    getSettings().then(async (saved) => {
      const progress = await getAllProgress();
      setSettings(saved);
      setCards(
        shuffleCards(
          getPracticeCards(saved.sourceLanguage, saved.targetLanguage).filter((card) => {
            const cardProgress = progress[card.id];
            const matchesCategory =
              !route.params?.category ||
              card.category === route.params.category ||
              Boolean(route.params?.groupedCategories?.includes(card.category));
            return (
              isKnownProgress(cardProgress) &&
              (saved.activeLevel === "All" || card.level === saved.activeLevel) &&
              createFillTask(card).hasGap &&
              matchesCategory
            );
          })
        )
      );
      setLoaded(true);
    });

    return () => {
      if (successSpeechTimer.current) {
        clearTimeout(successSpeechTimer.current);
      }
    };
  }, [route.params?.category]);

  const card = cards[index];
  const options = useMemo(() => {
    if (!card) return [];
    const wrong = cards.filter((item) => item.id !== card.id).map((item) => item.targetText);
    return shuffleCards([card.targetText, ...shuffleCards(wrong).slice(0, 3)]);
  }, [card, cards]);
  const fillTask = useMemo(() => (card ? createFillTask(card) : null), [card]);

  if (!settings || (!loaded && !card)) {
    return (
      <Screen title={t("sentence.title")} activeTab="Learn">
        <Text style={{ color: theme.text }}>{t("sentence.loading")}</Text>
      </Screen>
    );
  }

  if (!card) {
    return (
      <Screen title={t("sentence.title")} activeTab="Learn">
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{t("sentence.noKnownTitle")}</Text>
          <Text style={[styles.native, { color: theme.textMuted }]}>
            {t("sentence.noKnownBody")}
          </Text>
          <AppButton title={t("sentence.practiceCards")} onPress={() => navigation.navigate("Practice", {})} />
        </View>
      </Screen>
    );
  }

  const remaining = Math.max(cards.length - index, 0);
  const answered = Boolean(feedback);
  const visibleSentence =
    taskType === "fill" && fillTask
      ? answered
        ? fillTask.revealedSentence
        : fillTask.promptSentence
      : answered
        ? card.targetExample
        : createFillTask(card).promptSentence;
  const highlightedAnswer =
    taskType === "fill" && fillTask ? fillTask.highlightedAnswer : createFillTask(card).highlightedAnswer;

  function check(value: string) {
    if (!settings) return;
    setSelected(value);
    const expectedAnswers = [card.targetText, ...(fillTask?.expectedAnswers ?? [])].filter(Boolean) as string[];
    const nextFeedback = getBestFeedback(value, expectedAnswers);
    setFeedback(nextFeedback);
    if (nextFeedback.kind === "exact" || nextFeedback.kind === "close") {
      playSuccessAlert();
      if (successSpeechTimer.current) {
        clearTimeout(successSpeechTimer.current);
      }
      successSpeechTimer.current = setTimeout(() => {
        speak(card.targetExample, settings.targetLanguage);
      }, 700);
    } else {
      playFailAlert();
    }
  }

  function next() {
    if (successSpeechTimer.current) {
      clearTimeout(successSpeechTimer.current);
    }
    setFeedback(null);
    setTyped("");
    setSelected("");
    if (index + 1 >= cards.length) {
      navigation.navigate("PracticeHub");
      return;
    }
    setTaskType((current) => (current === "choose" ? "fill" : "choose"));
    setIndex((current) => current + 1);
  }

  return (
    <Screen
      title={t("sentence.title")}
      backLabel={index % 2 === 0 ? undefined : t("common.wordList")}
      activeTab={taskType === "choose" ? "Learn" : "Stats"}
      headerRight={
        <View style={[styles.levelBadge, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
          <Text style={styles.levelText}>
            {flagByLanguage[settings.targetLanguage]} {card.level}
          </Text>
        </View>
      }
    >
      <Text style={[styles.remaining, { color: theme.textMuted }]}>
        {t("sentence.knownRemaining", { mode: taskType === "choose" ? "sentences" : "practice sentences", remaining })}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => speak(card.targetExample, settings.targetLanguage)}
        style={[styles.listen, { backgroundColor: theme.surfaceMuted }]}
      >
        <Ionicons name="volume-high" size={25} color={theme.text} />
        <Text style={[styles.listenText, { color: theme.text }]}>{t("common.listen")}</Text>
      </Pressable>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>
          {taskType === "choose" ? t("sentence.chooseMissing") : t("sentence.fillBlank")}
        </Text>
        <SentenceLine sentence={visibleSentence} answer={highlightedAnswer} />

        {taskType === "choose" ? (
          <View style={styles.options}>
            {options.map((option) => {
              const isPicked = option === selected;
              const isCorrect = option === card.targetText;
              const isWrongPick = Boolean(feedback && isPicked && feedback.kind === "fail");
              const shouldShowCorrect = Boolean(feedback?.kind === "fail" && isCorrect);
              const shouldShowGood = Boolean(feedback && isPicked && feedback.kind !== "fail");
              const correctColors = getCorrectChoiceColors(theme);
              return (
                <Pressable
                  accessibilityRole="button"
                  key={option}
                  disabled={answered}
                  onPress={() => check(option)}
                  style={[
                    styles.option,
                    {
                      backgroundColor: isWrongPick
                        ? "#5c1518"
                        : shouldShowGood || shouldShowCorrect
                          ? correctColors.backgroundColor
                          : theme.surfaceMuted,
                      borderColor: isWrongPick
                        ? "#ff8f8f"
                        : shouldShowGood || shouldShowCorrect
                          ? correctColors.borderColor
                          : theme.border
                    }
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: isWrongPick
                          ? "#ffb7b7"
                          : shouldShowGood || shouldShowCorrect
                            ? correctColors.color
                            : theme.text
                      }
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <TextInput
            placeholder={t("sentence.typeMissing")}
            placeholderTextColor={theme.textMuted}
            value={typed}
            onChangeText={setTyped}
            onSubmitEditing={() => check(typed)}
            editable={!answered}
            style={[
              styles.input,
              {
                backgroundColor: getInputColors(feedback, theme).backgroundColor,
                borderColor: getInputColors(feedback, theme).borderColor,
                color: theme.text
              }
            ]}
          />
        )}

        <Text style={[styles.native, { color: theme.textMuted }]}>{t("sentence.nativeTranslation", { text: card.sourceExample })}</Text>

        {feedback ? (
          <>
            <AnswerFeedbackBanner feedback={feedback} />
            {feedback.kind === "fail" ? (
              <Text style={[styles.correctText, { color: theme.textMuted }]}>{t("sentence.correctAnswer", { answer: card.targetText })}</Text>
            ) : null}
          </>
        ) : taskType === "fill" ? (
          <AppButton title={t("common.check")} onPress={() => check(typed)} />
        ) : null}

        {feedback ? <AppButton title={t("common.next")} onPress={next} /> : null}
      </View>
    </Screen>
  );
}

function createFillTask(card: PracticeCardView): FillTask {
  const sentence = card.targetExample.trim();
  const match = findAnswerMatch(sentence, card.targetText);

  if (match) {
    return {
      promptSentence: `${sentence.slice(0, match.start)}____${sentence.slice(match.end)}`,
      revealedSentence: sentence,
      expectedAnswers: uniqueAnswers([card.targetText, match.text]),
      highlightedAnswer: match.text,
      hasGap: true
    };
  }

  return {
    promptSentence: `____ · ${sentence}`,
    revealedSentence: `${card.targetText} · ${sentence}`,
    expectedAnswers: [card.targetText],
    highlightedAnswer: card.targetText,
    hasGap: false
  };
}

function findAnswerMatch(sentence: string, answer: string) {
  const exact = findNormalizedPhrase(sentence, answer);
  if (exact) return exact;

  const phrase = findLoosePhrase(sentence, answer);
  if (phrase) return phrase;

  const normalizedAnswer = normalize(answer);
  if (!normalizedAnswer || normalizedAnswer.includes(" ")) return null;

  const tokenPattern = /[\p{L}\p{M}'’-]+/gu;
  for (const match of sentence.matchAll(tokenPattern)) {
    const text = match[0];
    const normalizedText = normalize(text);
    const lengthDelta = normalizedText.length - normalizedAnswer.length;
    const looksInflected =
      normalizedText.startsWith(normalizedAnswer) && lengthDelta > 0 && lengthDelta <= 3;

    if (normalizedText === normalizedAnswer || looksInflected) {
      const start = match.index ?? 0;
      return { start, end: start + text.length, text };
    }
  }

  return null;
}

function findLoosePhrase(sentence: string, answer: string) {
  const answerTokens = tokenize(answer);
  const sentenceTokens = tokenize(sentence);
  if (answerTokens.length < 2 || sentenceTokens.length < answerTokens.length) return null;

  for (let index = 0; index <= sentenceTokens.length - answerTokens.length; index += 1) {
    const slice = sentenceTokens.slice(index, index + answerTokens.length);
    const matches = slice.every((token, tokenIndex) => tokensMatchLoosely(token.normalized, answerTokens[tokenIndex].normalized));
    if (matches) {
      return {
        start: slice[0].start,
        end: slice[slice.length - 1].end,
        text: sentence.slice(slice[0].start, slice[slice.length - 1].end)
      };
    }
  }

  return null;
}

function tokenize(value: string) {
  const tokenPattern = /[\p{L}\p{M}'’-]+/gu;
  return [...value.matchAll(tokenPattern)].map((match) => {
    const text = match[0];
    const start = match.index ?? 0;
    return {
      text,
      normalized: normalize(text),
      start,
      end: start + text.length
    };
  });
}

function tokensMatchLoosely(token: string, expected: string) {
  if (!token || !expected) return false;
  if (token === expected) return true;

  const lengthDelta = token.length - expected.length;
  return token.startsWith(expected) && lengthDelta > 0 && lengthDelta <= 3;
}

function findNormalizedPhrase(sentence: string, answer: string) {
  const normalizedAnswer = normalize(answer);
  if (!normalizedAnswer) return null;

  for (let start = 0; start < sentence.length; start += 1) {
    for (let end = start + 1; end <= sentence.length; end += 1) {
      const candidate = sentence.slice(start, end);
      if (normalize(candidate) === normalizedAnswer) {
        return { start, end, text: candidate };
      }
    }
  }

  return null;
}

function getBestFeedback(value: string, expectedAnswers: string[]) {
  const feedbacks = uniqueAnswers(expectedAnswers).map((answer) => getAnswerFeedback(value, answer));
  return feedbacks.sort((left, right) => feedbackRank(left) - feedbackRank(right))[0];
}

function uniqueAnswers(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = normalize(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isKnownProgress(progress?: CardProgress) {
  return progress?.status === "known" || progress?.grade === "good" || progress?.grade === "easy";
}

function feedbackRank(feedback: AnswerFeedback) {
  if (feedback.kind === "exact") return 0;
  if (feedback.kind === "close") return 1;
  return 2;
}

function getInputColors(feedback: AnswerFeedback | null, theme: ReturnType<typeof useAppTheme>) {
  if (!feedback) {
    return { backgroundColor: theme.input, borderColor: theme.input };
  }

  if (feedback.kind === "fail") {
    return { backgroundColor: "#4a1820", borderColor: "#ff8f8f" };
  }

  if (feedback.kind === "close") {
    return { backgroundColor: "#4a3517", borderColor: "#ffd466" };
  }

  return getCorrectChoiceColors(theme);
}

function getCorrectChoiceColors(theme: ReturnType<typeof useAppTheme>) {
  return theme.isDark
    ? { backgroundColor: "#12845f", borderColor: "#35d99a", color: "#ffffff" }
    : { backgroundColor: "#169b70", borderColor: "#169b70", color: "#ffffff" };
}

function SentenceLine({ sentence, answer }: { sentence: string; answer: string }) {
  const theme = useAppTheme();
  const parts = sentence.split(answer);

  if (parts.length === 1) {
    return <Text style={[styles.sentence, { color: theme.text }]}>{sentence}</Text>;
  }

  return (
    <Text style={[styles.sentence, { color: theme.text }]}>
      {parts[0]}
      <Text style={styles.highlight}>{answer}</Text>
      {parts.slice(1).join(answer)}
    </Text>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 16
  },
  cardTitle: {
    fontSize: 21,
    fontWeight: "900"
  },
  correctText: {
    fontSize: 13,
    fontWeight: "700"
  },
  highlight: {
    backgroundColor: "#075d45",
    color: "#ffffff",
    fontWeight: "900"
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    fontSize: 18,
    minHeight: 48,
    paddingHorizontal: 18
  },
  levelBadge: {
    alignItems: "center",
    borderRadius: 28,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 18
  },
  levelText: {
    color: "#f4f5f8",
    fontSize: 14,
    fontWeight: "900"
  },
  listen: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 18
  },
  listenText: {
    fontSize: 17,
    fontWeight: "900"
  },
  native: {
    fontSize: 16,
    lineHeight: 22
  },
  option: {
    borderRadius: 13,
    borderWidth: 1,
    flex: 1,
    minHeight: 48,
    minWidth: "47%",
    justifyContent: "center",
    paddingHorizontal: 16
  },
  optionText: {
    fontSize: 16,
    fontWeight: "900"
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  remaining: {
    fontSize: 16,
    fontWeight: "900"
  },
  sentence: {
    fontSize: 21,
    lineHeight: 30
  }
});
