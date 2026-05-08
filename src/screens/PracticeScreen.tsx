import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, useColorScheme, View } from "react-native";
import { AnswerFeedbackBanner } from "../components/AnswerFeedbackBanner";
import { AppButton } from "../components/AppButton";
import { LearnerBadge } from "../components/LearnerBadge";
import { Screen } from "../components/Screen";
import { useI18n } from "../i18n";
import { RootStackParamList } from "../navigation/AppNavigator";
import { playFailAlert, playSuccessAlert } from "../services/alertSoundService";
import { AnswerFeedback, getAnswerFeedback } from "../services/feedbackService";
import { getAllProgress, getDueCards, recordReview } from "../services/progressService";
import { getSettings } from "../services/settingsService";
import { speak } from "../services/ttsService";
import { getPracticeCards, shuffleCards } from "../services/vocabularyService";
import { useAppTheme } from "../theme";
import { DifficultyGrade } from "../types/progress";
import { AppSettings, PracticeCardView } from "../types/vocabulary";

export type PracticeModeName = "flashcards" | "missing-word" | "fill-blank";
type Props = NativeStackScreenProps<RootStackParamList, "Practice">;

const gradeStyles: Record<DifficultyGrade, string> = {
  again: "#ad1d1d",
  hard: "#c65a00",
  good: "#2854d9",
  easy: "#08704f"
};

export function PracticeScreen({ navigation, route }: Props) {
  const theme = useAppTheme();
  const { t } = useI18n();
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [cards, setCards] = useState<PracticeCardView[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [completed, setCompleted] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [sessionTotal, setSessionTotal] = useState(0);

  useEffect(() => {
    setLoaded(false);
    setIndex(0);
    setCompleted(0);
    setSessionTotal(0);
    setRevealed(false);
    setTypedAnswer("");
    setFeedback(null);
    getSettings().then(async (saved) => {
      setSettings(saved);
      const allCards = getPracticeCards(saved.sourceLanguage, saved.targetLanguage).filter(
        (card) =>
          (saved.activeLevel === "All" || card.level === saved.activeLevel) &&
          (!route.params?.category ||
            card.category === route.params.category ||
            Boolean(route.params?.groupedCategories?.includes(card.category)))
      );
      const progress = await getAllProgress();
      const scopedCards = getScopedPracticeCards(allCards, progress, route.params);
      const due = getDueCards(scopedCards, progress);
      const sessionCards = route.params?.practiceSet || route.params?.grade ? scopedCards : due;
      const nextSessionCards = shuffleCards(sessionCards).slice(0, route.params?.practiceSet || route.params?.grade ? sessionCards.length : 20);
      setCards(nextSessionCards);
      setSessionTotal(nextSessionCards.length);
      setLoaded(true);
    });

    return () => {
      if (revealTimer.current) {
        clearTimeout(revealTimer.current);
      }
    };
  }, [route.params?.category, route.params?.grade, route.params?.practiceSet]);

  const card = cards[index];
  const remaining = cards.length;

  function playRevealAudio(nextFeedback?: AnswerFeedback | null) {
    if (!card || !settings) return;
    if (revealTimer.current) {
      clearTimeout(revealTimer.current);
    }
    if (nextFeedback?.kind === "exact" || nextFeedback?.kind === "close") {
      playSuccessAlert();
    } else if (nextFeedback?.kind === "fail") {
      playFailAlert();
    }
    revealTimer.current = setTimeout(() => {
      speak(card.targetText, settings.targetLanguage);
    }, 200);
  }

  function revealCard() {
    setRevealed(true);
    playRevealAudio(null);
  }

  function checkAnswer() {
    if (!card) return;
    const nextFeedback = getAnswerFeedback(typedAnswer, card.targetText);
    setFeedback(nextFeedback);
    setRevealed(true);
    playRevealAudio(nextFeedback);
  }

  async function grade(value: DifficultyGrade) {
    if (!card) return;
    await recordReview(card.id, value);
    if (revealTimer.current) {
      clearTimeout(revealTimer.current);
    }
    const currentCard = card;
    const shouldRepeat = value === "again" || value === "hard";
    const isStatsPractice = Boolean(route.params?.practiceSet || route.params?.grade);
    const isCategoryPractice = Boolean(route.params?.category || route.params?.groupedCategories?.length);
    const withoutCurrent = cards.filter((_item, itemIndex) => itemIndex !== index);
    if (!shouldRepeat && withoutCurrent.length === 0) {
      setCards([]);
      setCompleted((current) => current + 1);
      setRevealed(false);
      setTypedAnswer("");
      setFeedback(null);
      setIndex(0);
      if (isStatsPractice) {
        navigation.navigate("Stats");
      } else if (isCategoryPractice) {
        navigation.navigate("Learn");
      } else {
        navigation.navigate("PracticeHub");
      }
      return;
    }

    setCards((currentCards) => {
      const withoutCurrent = currentCards.filter((_item, itemIndex) => itemIndex !== index);
      if (!shouldRepeat) return withoutCurrent;
      const nextCards = [...withoutCurrent];
      const insertAt = Math.min(nextCards.length, index + 3 + Math.floor(Math.random() * 4));
      nextCards.splice(insertAt, 0, currentCard);
      return nextCards;
    });
    if (!shouldRepeat) {
      setCompleted((current) => current + 1);
    }
    setRevealed(false);
    setTypedAnswer("");
    setFeedback(null);
    setIndex((current) => (current >= cards.length - 1 ? 0 : current));
  }

  if (!settings || (!loaded && !card)) {
    return (
      <Screen title={t("common.practice")} backLabel={t("practice.selectLevel")} activeTab="Practice">
        <Text style={{ color: theme.text }}>{t("practice.loadingCards")}</Text>
      </Screen>
    );
  }

  if (!card) {
    return (
      <Screen
        title={t("common.practice")}
        backLabel={t("practice.selectLevel")}
        activeTab="Practice"
        headerRight={<LearnerBadge settings={settings} onPress={() => navigation.navigate("Onboarding", { settings })} />}
      >
        <Text style={[styles.progress, { color: theme.textMuted }]}>{t("practice.remainingCompleted", { remaining: 0, completed, total: sessionTotal })}</Text>
        <View style={[styles.card, { backgroundColor: theme.surfaceStrong }]}>
          <Text style={[styles.label, { color: theme.textMuted }]}>{t("practice.noCards")}</Text>
          <Text style={[styles.example, { color: theme.text }]}>
            {t("practice.noCardsBody")}
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      title={t("common.practice")}
      backLabel={t("practice.selectLevel")}
      activeTab="Practice"
      headerRight={<LearnerBadge settings={settings} onPress={() => navigation.navigate("Onboarding", { settings })} />}
    >
      <Text style={[styles.progress, { color: theme.textMuted }]}>
        {t("practice.remainingCompleted", { remaining, completed, total: sessionTotal })}
      </Text>

      <View style={[styles.card, { backgroundColor: theme.surfaceStrong }]}>
        <View style={styles.cardMetaRow}>
          <Text style={[styles.label, { color: theme.textMuted }]}>{revealed ? t("practice.answer") : t("practice.translate")}</Text>
          <Text style={[styles.partOfSpeech, { color: theme.text, borderColor: theme.border }]}>{card.partOfSpeech}</Text>
        </View>
        <View style={styles.wordRow}>
          <Text style={[styles.answer, { color: theme.text }]}>{revealed ? card.targetText : card.sourceText}</Text>
          <SoundButton onPress={() => speak(revealed ? card.targetText : card.sourceText, revealed ? settings.targetLanguage : settings.sourceLanguage)} />
        </View>
        {revealed ? (
          <>
            <View style={styles.exampleRow}>
              <Text style={[styles.example, { color: theme.text }]}>{card.targetExample}</Text>
              <SoundButton onPress={() => speak(card.targetExample, settings.targetLanguage)} />
            </View>
            <Text style={[styles.translation, { color: theme.text }]}>{card.sourceExample}</Text>
          </>
        ) : null}
      </View>

      {!revealed ? (
        <View style={styles.answerBlock}>
          <TextInput
            placeholder={t("practice.typeAnswer")}
            placeholderTextColor={theme.textMuted}
            value={typedAnswer}
            onChangeText={setTypedAnswer}
            onSubmitEditing={checkAnswer}
            style={[styles.input, { backgroundColor: theme.input, color: theme.text }]}
          />
          <View style={styles.answerActions}>
            <AppButton title={t("practice.reveal")} variant="secondary" onPress={revealCard} style={styles.actionButton} />
            <AppButton title={t("common.check")} onPress={checkAnswer} style={styles.actionButton} />
          </View>
        </View>
      ) : null}

      {revealed ? (
        <>
          <AnswerFeedbackBanner feedback={feedback} />
          <Text style={[styles.gradeInfoText, { color: theme.textMuted }]}>
            {t("practice.gradeInfo")}
          </Text>
          {(["again", "hard", "good", "easy"] as DifficultyGrade[]).map((item) => (
            <Pressable
              accessibilityRole="button"
              key={item}
              onPress={() => grade(item)}
              style={[styles.gradeButton, { backgroundColor: gradeStyles[item] }]}
            >
              <Text style={styles.gradeText}>{capitalize(item)}</Text>
            </Pressable>
          ))}
          <View style={styles.practiceShortcuts}>
            <AppButton
              title={t("practice.writingPractice")}
              variant="secondary"
              onPress={() => navigation.navigate("AiWritingPractice", { cardId: card.id })}
              style={styles.shortcut}
            />
            <AppButton
              title={t("practice.speakingPractice")}
              onPress={() => navigation.navigate("AiSpeakingPractice", { cardId: card.id })}
              style={styles.shortcut}
            />
          </View>
        </>
      ) : null}
    </Screen>
  );
}

function getScopedPracticeCards(
  cards: PracticeCardView[],
  progress: Awaited<ReturnType<typeof getAllProgress>>,
  params?: Props["route"]["params"]
) {
  if (params?.practiceSet === "known") {
    return cards.filter((card) => {
      const cardProgress = progress[card.id];
      return cardProgress?.status === "known" || cardProgress?.grade === "good" || cardProgress?.grade === "easy";
    });
  }

  if (params?.practiceSet === "weak") {
    return cards.filter((card) => {
      const cardProgress = progress[card.id];
      return cardProgress?.status === "weak" || cardProgress?.grade === "again";
    });
  }

  if (params?.grade) {
    return cards.filter((card) => progress[card.id]?.grade === params.grade);
  }

  return cards;
}

function SoundButton({ onPress }: { onPress: () => void }) {
  const theme = useAppTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.sound, { backgroundColor: theme.soundButton }]}>
      <Ionicons name="volume-high" size={25} color={theme.text} />
    </Pressable>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1
  },
  answer: {
    flex: 1,
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 35
  },
  answerActions: {
    flexDirection: "row",
    gap: 10
  },
  answerBlock: {
    gap: 10
  },
  card: {
    borderRadius: 16,
    gap: 12,
    minHeight: 210,
    padding: 16
  },
  cardMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  example: {
    flex: 1,
    fontSize: 16,
    lineHeight: 21
  },
  exampleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  gradeButton: {
    alignItems: "center",
    borderRadius: 14,
    minHeight: 46,
    justifyContent: "center"
  },
  gradeText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900"
  },
  gradeInfoText: {
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 15,
    marginTop: -6
  },
  input: {
    borderRadius: 12,
    fontSize: 16,
    minHeight: 46,
    paddingHorizontal: 14
  },
  label: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2
  },
  partOfSpeech: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 13,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5,
    textTransform: "lowercase"
  },
  practiceShortcuts: {
    flexDirection: "row",
    gap: 10,
    marginTop: -2
  },
  progress: {
    fontSize: 14,
    fontWeight: "900"
  },
  shortcut: {
    flex: 1
  },
  sound: {
    alignItems: "center",
    borderRadius: 28,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  translation: {
    fontSize: 16,
    lineHeight: 21
  },
  wordRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  }
});
