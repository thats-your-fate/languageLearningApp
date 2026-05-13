import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { LearnerBadge } from "../components/LearnerBadge";
import { Screen } from "../components/Screen";
import { useI18n } from "../i18n";
import { RootStackParamList } from "../navigation/AppNavigator";
import {
  discoveryPauseMs,
  discoverySpokenItems,
  prefetchDiscoveryCardAudio,
} from "../services/discoveryPlaybackService";
import { getAllProgress } from "../services/progressService";
import { getSettings } from "../services/settingsService";
import { playSilenceUntilDone, speakUntilDone, stop } from "../services/ttsService";
import { getPracticeCards, shuffleCards } from "../services/vocabularyService";
import { useAppTheme } from "../theme";
import { CardProgress } from "../types/progress";
import { AppSettings, PracticeCardView } from "../types/vocabulary";

type Props = NativeStackScreenProps<RootStackParamList, "DiscoveryPractice">;

export function DiscoveryPracticeScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { t } = useI18n();
  const playbackRun = useRef(0);
  const stoppedRef = useRef(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [cards, setCards] = useState<PracticeCardView[]>([]);
  const [index, setIndex] = useState(0);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
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
      stopPlaybackRun();
      stop();
    };
  }, []);

  useEffect(() => {
    if (settings && card && !stoppedRef.current) {
      runPlaySequence();
    }
    // The card index intentionally drives autoplay when entering and moving next.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, index, card?.id]);

  function stopPlaybackRun() {
    playbackRun.current += 1;
  }

  function runPlaySequence() {
    void playSequence().catch((error) => {
      setPlaying(false);
      setPlaybackError(error instanceof Error ? error.message : "Audio playback failed.");
    });
  }

  async function playSequence() {
    if (!settings || !card) return;
    stopPlaybackRun();
    const runId = playbackRun.current;
    stoppedRef.current = false;
    setPlaying(true);
    setPlaybackError(null);

    void prefetchDiscoveryCardAudio(card, settings);
    const nextCard = cards[index + 1] ?? cards[0];
    if (nextCard && nextCard.id !== card.id) {
      void prefetchDiscoveryCardAudio(nextCard, settings);
    }

    for (const item of discoverySpokenItems(card, settings)) {
      if (runId !== playbackRun.current || stoppedRef.current) return;
      await speakUntilDone(item.text, item.language);
      if (runId !== playbackRun.current || stoppedRef.current) return;
      await playSilenceUntilDone(discoveryPauseMs);
    }

    if (runId !== playbackRun.current || stoppedRef.current) return;
    setPlaying(false);
    setIndex((current) => (current + 1 >= cards.length ? 0 : current + 1));
  }

  async function handlePlaybackPress() {
    if (playing) {
      stoppedRef.current = true;
      setPlaying(false);
      stopPlaybackRun();
      await stop();
      return;
    }

    stoppedRef.current = false;
    runPlaySequence();
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
      {playbackError ? <Text style={[styles.errorText, { color: theme.danger }]}>{playbackError}</Text> : null}
      <AppButton title={playing ? t("common.stop") : t("discovery.playSequence")} onPress={handlePlaybackPress} />
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
  errorText: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20
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
  progress: {
    fontSize: 15,
    fontWeight: "900"
  },
  word: {
    fontSize: 34,
    fontWeight: "900"
  }
});
