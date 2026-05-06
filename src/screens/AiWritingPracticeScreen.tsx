import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { LearnerBadge } from "../components/LearnerBadge";
import { Screen } from "../components/Screen";
import { useI18n } from "../i18n";
import { RootStackParamList } from "../navigation/AppNavigator";
import { evaluateWritingAnswerStream, explainAiFeedbackInSourceLanguage } from "../services/aiPracticeService";
import { getAllProgress } from "../services/progressService";
import { getSettings } from "../services/settingsService";
import { getCardById, getPracticeCards, shuffleCards, toPracticeCardView } from "../services/vocabularyService";
import { useAppTheme } from "../theme";
import { AiPracticeResult } from "../types/aiPractice";
import { AppSettings, LANGUAGE_LABELS, PracticeCardView } from "../types/vocabulary";

type Props = NativeStackScreenProps<RootStackParamList, "AiWritingPractice">;

export function AiWritingPracticeScreen({ navigation, route }: Props) {
  const theme = useAppTheme();
  const { t } = useI18n();
  const tokenBuffer = useRef("");
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFlushedStream = useRef(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [cards, setCards] = useState<PracticeCardView[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<AiPracticeResult | null>(null);
  const [streamedFeedback, setStreamedFeedback] = useState("");
  const [sourceExplanation, setSourceExplanation] = useState("");
  const [explaining, setExplaining] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scoreVisible, setScoreVisible] = useState(false);
  const [scorePreview, setScorePreview] = useState<number | null>(null);
  const card = cards[index];

  useEffect(() => {
    getSettings().then(async (saved) => {
      const progress = await getAllProgress();
      const eligibleCards = getPracticeCards(saved.sourceLanguage, saved.targetLanguage).filter((item) => {
        const cardProgress = progress[item.id];
        return cardProgress?.status === "known" || cardProgress?.grade === "good" || cardProgress?.grade === "easy";
      });
      const raw = route.params?.cardId ? getCardById(route.params.cardId) : null;
      const pinnedCard =
        raw && (progress[raw.id]?.status === "known" || progress[raw.id]?.grade === "good" || progress[raw.id]?.grade === "easy")
          ? toPracticeCardView(raw, saved.sourceLanguage, saved.targetLanguage)
          : null;
      const shuffledCards = shuffleCards(eligibleCards.filter((item) => item.id !== pinnedCard?.id));
      setCards(pinnedCard ? [pinnedCard, ...shuffledCards] : shuffledCards);
      setIndex(0);
      setSettings(saved);
    });

    return () => {
      clearStreamBuffer();
    };
  }, [route.params?.cardId]);

  async function submit(userAnswer = answer) {
    if (!card || !settings) return;
    Keyboard.dismiss();
    clearStreamBuffer();
    setLoading(true);
    setResult(null);
    setStreamedFeedback("");
    setSourceExplanation("");
    setScoreVisible(true);
    setScorePreview(null);
    let gotStream = false;
    const nextResult = await evaluateWritingAnswerStream(
      card,
      userAnswer,
      settings.targetLanguage,
      (token) => {
        gotStream = true;
        enqueueStreamToken(token);
      },
      (partialResult) => {
        setScoreVisible(true);
        setResult(partialResult);
        setScorePreview(null);
      },
      (preview) => {
        setScoreVisible(true);
        setScorePreview(preview);
      }
    );
    flushStreamBuffer();
    setResult(nextResult);
    if (!gotStream) {
      setStreamedFeedback(formatResultFeedback(nextResult));
    }
    setLoading(false);
  }

  function nextCard() {
    clearStreamBuffer();
    setResult(null);
    setStreamedFeedback("");
    setSourceExplanation("");
    setScoreVisible(false);
    setScorePreview(null);
    setAnswer("");
    setIndex((current) => (current + 1 >= cards.length ? 0 : current + 1));
  }

  function tryAgain() {
    clearStreamBuffer();
    setResult(null);
    setStreamedFeedback("");
    setSourceExplanation("");
    setScoreVisible(false);
    setScorePreview(null);
    setAnswer("");
  }

  async function explainInMyLanguage() {
    if (!card || !result) return;
    setExplaining(true);
    setSourceExplanation(await explainAiFeedbackInSourceLanguage(card, answer, result));
    setExplaining(false);
  }

  function enqueueStreamToken(token: string) {
    tokenBuffer.current += token;
    if (!hasFlushedStream.current) {
      hasFlushedStream.current = true;
      flushStreamBuffer();
      return;
    }
    if (!flushTimer.current) {
      flushTimer.current = setTimeout(flushStreamBuffer, 20);
    }
  }

  function flushStreamBuffer() {
    if (flushTimer.current) {
      clearTimeout(flushTimer.current);
      flushTimer.current = null;
    }
    if (!tokenBuffer.current) return;
    const chunk = tokenBuffer.current;
    tokenBuffer.current = "";
    setStreamedFeedback((current) => current + chunk);
  }

  function clearStreamBuffer() {
    if (flushTimer.current) {
      clearTimeout(flushTimer.current);
      flushTimer.current = null;
    }
    tokenBuffer.current = "";
    hasFlushedStream.current = false;
  }

  function scoreLabel() {
    if (result) return `Score: ${Math.round(result.score * 100)}%`;
    if (scorePreview !== null) return `Score: ~${Math.round(scorePreview * 100)}%`;
    return "Score: ...";
  }

  function scoreColor() {
    const visibleScore = result?.score ?? scorePreview;
    if (visibleScore === null || visibleScore === undefined) return theme.textMuted;
    return visibleScore >= 0.8 ? theme.success : "#ffd166";
  }

  if (!settings) {
    return (
      <Screen title={t("aiWriting.title")} backLabel={t("common.practice")} activeTab="Practice">
        <Text style={{ color: theme.text }}>{t("aiWriting.loading")}</Text>
      </Screen>
    );
  }

  if (!card) {
    return (
      <Screen
        title={t("aiWriting.title")}
        backLabel={t("common.practice")}
        activeTab="Practice"
        headerRight={<LearnerBadge settings={settings} onPress={() => navigation.navigate("Onboarding", { settings })} />}
      >
        <Text style={[styles.title, { color: theme.text }]}>{t("aiWriting.title")}</Text>
        <View style={[styles.promptCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.prompt, { color: theme.textMuted }]}>
            {t("aiWriting.noKnown")}
          </Text>
          <AppButton title={t("practiceHub.flashcardsTitle")} onPress={() => navigation.navigate("Practice", {})} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      title={t("aiWriting.title")}
      backLabel={t("common.practice")}
      activeTab="Practice"
      headerRight={<LearnerBadge settings={settings} onPress={() => navigation.navigate("Onboarding", { settings })} />}
    >
      <Text style={[styles.title, { color: theme.text }]}>{t("aiWriting.title")}</Text>
      <Text style={[styles.progress, { color: theme.textMuted }]}>
        {index + 1} / {cards.length}
      </Text>

      <View style={[styles.promptCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.prompt, { color: theme.textMuted }]}>
          {t("aiWriting.prompt", { language: LANGUAGE_LABELS[settings.targetLanguage] })}
        </Text>
        <Text style={[styles.word, { color: theme.text }]}>{card.targetText}</Text>
        <View style={[styles.reference, { borderColor: theme.border }]}>
          <Text style={[styles.referenceLabel, { color: theme.textMuted }]}>
            {t("aiWriting.reference")}
          </Text>
          <Text style={[styles.referenceText, { color: theme.text }]}>{card.sourceExample}</Text>
        </View>
      </View>

      <TextInput
        multiline
        placeholder={t("aiWriting.placeholder")}
        placeholderTextColor={theme.textMuted}
        value={answer}
        onChangeText={setAnswer}
        style={[styles.answerInput, { backgroundColor: theme.input, color: theme.text }]}
      />

      {!result && !loading ? (
        <View style={styles.actionRow}>
          <AppButton title={t("common.pass")} variant="secondary" onPress={nextCard} style={styles.actionButton} />
          <AppButton title={t("common.check")} onPress={() => submit()} style={styles.actionButton} />
        </View>
      ) : null}

      {scoreVisible || result || streamedFeedback || loading ? (
        <View style={[styles.resultCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.scoreRow}>
            <Text style={[styles.score, { color: scoreColor() }]}>
              {scoreLabel()}
            </Text>
            {loading && !result ? <ActivityIndicator color={theme.primary} /> : null}
          </View>
          {streamedFeedback || result ? (
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
              {t(result?.source === "fallback" ? "aiWriting.offlineFeedback" : "aiWriting.feedback")}
            </Text>
          ) : null}
          {result?.source === "fallback" && result.offlineReason ? (
            <Text style={[styles.offlineReason, { color: theme.textMuted }]}>
              {result.offlineReason}
            </Text>
          ) : null}
          <Text
            style={[
              styles.streamed,
              result && result.score < 0.8 && styles.streamedIssue,
              { color: theme.text }
            ]}
          >
            {streamedFeedback}
          </Text>
          {result?.correctedAnswer ? (
            <>
              <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{t("aiWriting.exampleSentence")}</Text>
              <Text style={[styles.correction, { color: theme.text }]}>{result.correctedAnswer}</Text>
            </>
          ) : null}
          {result ? (
            <>
              <AppButton
                title={explaining ? t("common.loading") : t("aiWriting.explainInMyLanguage")}
                variant="secondary"
                onPress={explainInMyLanguage}
              />
              {sourceExplanation ? (
                <>
                  <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{t("aiWriting.explanation")}</Text>
                  <Text style={[styles.sourceExplanation, { color: theme.text }]}>{sourceExplanation}</Text>
                </>
              ) : null}
              <View style={styles.resultButtons}>
                <AppButton title={t("common.tryAgain")} variant="secondary" onPress={tryAgain} style={styles.resultButton} />
                <AppButton title={t("common.next")} onPress={nextCard} style={styles.resultButton} />
              </View>
            </>
          ) : null}
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate("AiSpeakingPractice", { cardId: card.id })}
        style={styles.speakingLink}
      >
        <Text style={[styles.speakingText, { color: theme.textMuted }]}>{t("aiWriting.practiceSpeaking")}</Text>
      </Pressable>
    </Screen>
  );
}

function formatResultFeedback(result: AiPracticeResult) {
  return [
    result.feedback,
    result.grammarNotes.length > 0 ? `\n\nGrammar notes\n${result.grammarNotes.map((note) => `• ${note}`).join("\n")}` : ""
  ]
    .filter(Boolean)
    .join("");
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1
  },
  actionRow: {
    flexDirection: "row",
    gap: 10
  },
  answerInput: {
    borderRadius: 12,
    fontSize: 18,
    minHeight: 76,
    padding: 14,
    textAlignVertical: "top"
  },
  correction: {
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21
  },
  offlineReason: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16
  },
  progress: {
    fontSize: 14,
    fontWeight: "900",
    marginTop: -8
  },
  prompt: {
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 21
  },
  promptCard: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 14
  },
  reference: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 12
  },
  referenceLabel: {
    fontSize: 13,
    fontWeight: "900"
  },
  referenceText: {
    fontSize: 15,
    lineHeight: 21
  },
  resultButton: {
    flex: 1
  },
  resultButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8
  },
  resultCard: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 9,
    padding: 14
  },
  score: {
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36
  },
  scoreRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "900",
    marginTop: 4
  },
  speakingLink: {
    alignItems: "center",
    paddingBottom: 4,
    paddingTop: 2
  },
  speakingText: {
    fontSize: 14,
    fontWeight: "800"
  },
  sourceExplanation: {
    fontSize: 15,
    lineHeight: 21
  },
  streamed: {
    fontSize: 17,
    lineHeight: 24
  },
  streamedIssue: {
    fontSize: 20,
    lineHeight: 28
  },
  title: {
    fontSize: 29,
    fontWeight: "900",
    lineHeight: 33
  },
  word: {
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 32
  }
});
