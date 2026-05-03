import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { LearnerBadge } from "../components/LearnerBadge";
import { Screen } from "../components/Screen";
import { useI18n } from "../i18n";
import { RootStackParamList } from "../navigation/AppNavigator";
import { getAllProgress } from "../services/progressService";
import { getSettings } from "../services/settingsService";
import { speak, stop } from "../services/ttsService";
import { getPracticeCards, shuffleCards } from "../services/vocabularyService";
import { useAppTheme } from "../theme";
import { CardProgress } from "../types/progress";
import { AppSettings, PracticeCardView } from "../types/vocabulary";

type Props = NativeStackScreenProps<RootStackParamList, "DiscoveryPractice">;

export function DiscoveryPracticeScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { t } = useI18n();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const playbackRun = useRef(0);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [cards, setCards] = useState<PracticeCardView[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const card = cards[index];

  useEffect(() => {
    getSettings().then(async (saved) => {
      const progress = await getAllProgress();
      setSettings(saved);
      setCards(
        shuffleCards(
          getPracticeCards(saved.sourceLanguage, saved.targetLanguage).filter((item) => {
            const cardProgress = progress[item.id];
            return (
              (saved.activeLevel === "All" || item.level === saved.activeLevel) &&
              !isKnownProgress(cardProgress)
            );
          })
        )
      );
    });

    return () => {
      clearTimers();
      stop();
    };
  }, []);

  useEffect(() => {
    if (settings && card && !paused) {
      playSequence();
    }
    // The card index intentionally drives autoplay when entering and moving next.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, index, card?.id, paused]);

  function clearTimers() {
    playbackRun.current += 1;
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function delayFor(text: string): number {
    return Math.max(1300, Math.min(3400, text.length * 55));
  }

  async function playSequence() {
    if (!settings || !card) return;
    clearTimers();
    const runId = playbackRun.current;
    setPlaying(true);
    const sequence = [
      { text: card.targetText, language: settings.targetLanguage },
      { text: card.sourceText, language: settings.sourceLanguage },
      { text: card.targetExample, language: settings.targetLanguage },
      { text: card.sourceExample, language: settings.sourceLanguage }
    ];
    let offset = 0;
    sequence.forEach((item, itemIndex) => {
      timers.current.push(
        setTimeout(() => {
          if (runId !== playbackRun.current || paused) return;
          speak(item.text, item.language);
          if (itemIndex === sequence.length - 1) {
            timers.current.push(
              setTimeout(() => {
                if (runId !== playbackRun.current || paused) return;
                setPlaying(false);
                setIndex((current) => (current + 1 >= cards.length ? 0 : current + 1));
              }, delayFor(item.text) + 1500)
            );
          }
        }, offset)
      );
      offset += delayFor(item.text) + 1500;
    });
  }

  function next() {
    clearTimers();
    stop();
    setPlaying(false);
    setIndex((current) => (current + 1 >= cards.length ? 0 : current + 1));
  }

  function togglePause() {
    if (paused) {
      setPaused(false);
      return;
    }
    clearTimers();
    stop();
    setPlaying(false);
    setPaused(true);
  }

  function isKnownProgress(progress?: CardProgress) {
    return progress?.status === "known" || progress?.grade === "good" || progress?.grade === "easy";
  }

  if (!settings || !card) {
    return (
      <Screen title={t("discovery.title")} backLabel={t("common.practice")} activeTab="Practice">
        <Text style={{ color: theme.text }}>{t("discovery.loading")}</Text>
      </Screen>
    );
  }

  return (
    <Screen
      title={t("discovery.title")}
      backLabel={t("common.practice")}
      activeTab="Practice"
      headerRight={<LearnerBadge settings={settings} onPress={() => navigation.navigate("Onboarding", { settings })} />}
    >
      <Text style={[styles.progress, { color: theme.textMuted }]}>
        {t("discovery.cardProgress", { current: index + 1, total: cards.length })}
      </Text>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.label, { color: theme.textMuted }]}>{t("discovery.learnerLanguage")}</Text>
        <Text style={[styles.word, { color: theme.text }]}>{card.targetText}</Text>
        <Text style={[styles.example, { color: theme.text }]}>{card.targetExample}</Text>
        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
        <Text style={[styles.label, { color: theme.textMuted }]}>{t("discovery.nativeTranslation")}</Text>
        <Text style={[styles.native, { color: theme.textMuted }]}>{card.sourceText}</Text>
        <Text style={[styles.nativeExample, { color: theme.textMuted }]}>{card.sourceExample}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={playSequence}
        disabled={playing}
        style={[styles.play, { backgroundColor: playing ? theme.surfaceMuted : "#eef1f6" }]}
      >
        <Ionicons name={playing ? "volume-high" : "play"} size={22} color={theme.primaryText} />
        <Text style={[styles.playText, { color: theme.primaryText }]}>{playing ? t("discovery.playing") : t("discovery.playSequence")}</Text>
      </Pressable>
      <AppButton title={paused ? t("discovery.resumeAutoplay") : t("discovery.pauseAutoplay")} variant="secondary" onPress={togglePause} />
      <AppButton title={t("discovery.nextCard")} variant="secondary" onPress={next} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 18
  },
  divider: {
    height: 1,
    marginVertical: 2
  },
  example: {
    fontSize: 18,
    lineHeight: 25
  },
  label: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  native: {
    fontSize: 20,
    fontWeight: "900"
  },
  nativeExample: {
    fontSize: 16,
    lineHeight: 23
  },
  play: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 48
  },
  playText: {
    fontSize: 15,
    fontWeight: "900"
  },
  progress: {
    fontSize: 15,
    fontWeight: "900"
  },
  word: {
    fontSize: 34,
    fontWeight: "900"
  }
});
