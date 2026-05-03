import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, Text, TextInput, useColorScheme, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { LearnerBadge } from "../components/LearnerBadge";
import { Screen } from "../components/Screen";
import { useI18n } from "../i18n";
import { RootStackParamList } from "../navigation/AppNavigator";
import { evaluateWritingAnswer } from "../services/aiPracticeService";
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
  const streamTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [cards, setCards] = useState<PracticeCardView[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<AiPracticeResult | null>(null);
  const [streamedFeedback, setStreamedFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const card = cards[index];

  useEffect(() => {
    getSettings().then(async (saved) => {
      const progress = await getAllProgress();
      const allCards = shuffleCards(
        getPracticeCards(saved.sourceLanguage, saved.targetLanguage).filter((item) => {
          const cardProgress = progress[item.id];
          return cardProgress?.status === "known" || cardProgress?.grade === "good" || cardProgress?.grade === "easy";
        })
      );
      const raw = route.params?.cardId ? getCardById(route.params.cardId) : null;
      const initial =
        raw && (progress[raw.id]?.status === "known" || progress[raw.id]?.grade === "good" || progress[raw.id]?.grade === "easy")
          ? toPracticeCardView(raw, saved.sourceLanguage, saved.targetLanguage)
          : allCards[0];
      setCards(initial ? [initial, ...allCards.filter((item) => item.id !== initial.id)] : allCards);
      setSettings(saved);
    });

    return () => {
      if (streamTimer.current) {
        clearInterval(streamTimer.current);
      }
    };
  }, [route.params?.cardId]);

  async function submit(userAnswer = answer) {
    if (!card || !settings) return;
    Keyboard.dismiss();
    if (streamTimer.current) {
      clearInterval(streamTimer.current);
    }
    setLoading(true);
    setResult(null);
    setStreamedFeedback("");
    const nextResult = await evaluateWritingAnswer(card, userAnswer, settings.targetLanguage);
    setResult(nextResult);
    streamRecommendation(nextResult);
    setLoading(false);
  }

  function streamRecommendation(nextResult: AiPracticeResult) {
    const text = [
      nextResult.feedback,
      nextResult.grammarNotes.length > 0 ? `\n\nGrammar notes\n${nextResult.grammarNotes.map((note) => `• ${note}`).join("\n")}` : ""
    ]
      .filter(Boolean)
      .join("");
    let cursor = 0;
    streamTimer.current = setInterval(() => {
      cursor += 3;
      setStreamedFeedback(text.slice(0, cursor));
      if (cursor >= text.length && streamTimer.current) {
        clearInterval(streamTimer.current);
      }
    }, 24);
  }

  function nextCard() {
    if (streamTimer.current) {
      clearInterval(streamTimer.current);
    }
    setResult(null);
    setStreamedFeedback("");
    setAnswer("");
    setIndex((current) => (current + 1 >= cards.length ? 0 : current + 1));
  }

  function tryAgain() {
    if (streamTimer.current) {
      clearInterval(streamTimer.current);
    }
    setResult(null);
    setStreamedFeedback("");
    setAnswer("");
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

      {loading ? <ActivityIndicator color={theme.primary} /> : null}

      {result ? (
        <View style={[styles.resultCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.score, { color: result.score >= 0.8 ? theme.success : "#ffd166" }]}>
            Score: {result.score.toFixed(2)}
          </Text>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{t("aiWriting.feedback")}</Text>
          <Text
            style={[
              styles.streamed,
              result.score < 0.8 && styles.streamedIssue,
              { color: theme.text }
            ]}
          >
            {streamedFeedback}
          </Text>
          {result.correctedAnswer ? (
            <>
              <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{t("aiWriting.exampleSentence")}</Text>
              <Text style={[styles.correction, { color: theme.text }]}>{result.correctedAnswer}</Text>
            </>
          ) : null}
          <View style={styles.resultButtons}>
            <AppButton title={t("common.tryAgain")} variant="secondary" onPress={tryAgain} style={styles.resultButton} />
            <AppButton title={t("common.next")} onPress={nextCard} style={styles.resultButton} />
          </View>
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
    fontSize: 18,
    fontWeight: "900"
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
