import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { LearnerBadge } from "../components/LearnerBadge";
import { Screen } from "../components/Screen";
import { useI18n } from "../i18n";
import { RootStackParamList } from "../navigation/AppNavigator";
import {
  discoveryFinalSilenceMs,
  playDiscoveryCard,
  prefetchDiscoveryCardAudio,
  subscribeDiscoveryFinalSilence,
  subscribeDiscoveryPlaybackEnded,
  subscribeDiscoveryPlaybackError,
  stopDiscoveryPlayback,
  subscribeDiscoveryPlaybackState,
  subscribeDiscoveryQueueEnded
} from "../services/discoveryPlaybackService";
import { getAllProgress } from "../services/progressService";
import { getSettings } from "../services/settingsService";
import { speakUntilDone, stop } from "../services/ttsService";
import { getPracticeCards, shuffleCards } from "../services/vocabularyService";
import { useAppTheme } from "../theme";
import { CardProgress } from "../types/progress";
import { AppSettings, PracticeCardView } from "../types/vocabulary";

type Props = NativeStackScreenProps<RootStackParamList, "DiscoveryPractice">;

export function DiscoveryPracticeScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { t } = useI18n();
  const timers = useRef<{ timer: ReturnType<typeof setTimeout>; resolve: () => void }[]>([]);
  const playbackRun = useRef(0);
  const stoppedRef = useRef(false);
  const forceSpeechFallbackRef = useRef(false);
  const usingTrackPlayerRef = useRef(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [cards, setCards] = useState<PracticeCardView[]>([]);
  const [index, setIndex] = useState(0);
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
      clearTimers();
      stopDiscoveryPlayback();
      stop();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    let cleanupPlaybackError: (() => void) | undefined;
    let cleanupPlaybackEnded: (() => void) | undefined;
    let cleanupFinalSilence: (() => void) | undefined;
    let cleanupQueueEnded: (() => void) | undefined;
    let cleanupPlaybackState: (() => void) | undefined;
    let finalSilenceTimer: ReturnType<typeof setTimeout> | null = null;

    const finishTrackPlayerCard = () => {
      if (!mounted || !usingTrackPlayerRef.current || stoppedRef.current) return;
      if (finalSilenceTimer) {
        clearTimeout(finalSilenceTimer);
        finalSilenceTimer = null;
      }
      usingTrackPlayerRef.current = false;
      setPlaying(false);
      setIndex((current) => (current + 1 >= cards.length ? 0 : current + 1));
    };

    subscribeDiscoveryQueueEnded(finishTrackPlayerCard).then((subscription) => {
      cleanupQueueEnded = () => subscription?.remove();
    });

    subscribeDiscoveryPlaybackEnded(finishTrackPlayerCard).then((subscription) => {
      cleanupPlaybackEnded = () => subscription?.remove();
    });

    subscribeDiscoveryFinalSilence(() => {
      if (finalSilenceTimer) {
        clearTimeout(finalSilenceTimer);
      }
      finalSilenceTimer = setTimeout(finishTrackPlayerCard, discoveryFinalSilenceMs + 350);
    }).then((subscription) => {
      cleanupFinalSilence = () => subscription?.remove();
    });

    subscribeDiscoveryPlaybackState((isPlaying) => {
      if (!mounted || !usingTrackPlayerRef.current || stoppedRef.current) return;
      setPlaying(isPlaying);
    }).then((subscription) => {
      cleanupPlaybackState = () => subscription?.remove();
    });

    subscribeDiscoveryPlaybackError(() => {
      if (!mounted || !usingTrackPlayerRef.current || stoppedRef.current) return;
      usingTrackPlayerRef.current = false;
      forceSpeechFallbackRef.current = true;
      playSequence();
    }).then((subscription) => {
      cleanupPlaybackError = () => subscription?.remove();
    });

    return () => {
      mounted = false;
      if (finalSilenceTimer) {
        clearTimeout(finalSilenceTimer);
      }
      cleanupPlaybackError?.();
      cleanupPlaybackEnded?.();
      cleanupFinalSilence?.();
      cleanupQueueEnded?.();
      cleanupPlaybackState?.();
    };
  }, [cards.length]);

  useEffect(() => {
    if (settings && card && !stoppedRef.current) {
      playSequence();
    }
    // The card index intentionally drives autoplay when entering and moving next.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, index, card?.id]);

  function clearTimers() {
    playbackRun.current += 1;
    timers.current.forEach(({ timer, resolve }) => {
      clearTimeout(timer);
      resolve();
    });
    timers.current = [];
  }

  async function playSequence() {
    if (!settings || !card) return;
    clearTimers();
    const runId = playbackRun.current;
    stoppedRef.current = false;
    setPlaying(true);

    if (!forceSpeechFallbackRef.current) {
      usingTrackPlayerRef.current = await playDiscoveryCard(card, settings);
      if (runId !== playbackRun.current || stoppedRef.current) return;
      if (usingTrackPlayerRef.current) {
        const nextCard = cards[index + 1] ?? cards[0];
        if (nextCard && nextCard.id !== card.id) {
          prefetchDiscoveryCardAudio(nextCard, settings);
        }
        return;
      }
    }
    forceSpeechFallbackRef.current = false;

    const sequence = [
      { text: card.targetText, language: settings.targetLanguage },
      { text: card.sourceText, language: settings.sourceLanguage },
      { text: card.targetExample, language: settings.targetLanguage },
      { text: card.sourceExample, language: settings.sourceLanguage }
    ];

    for (const item of sequence) {
      if (runId !== playbackRun.current || stoppedRef.current) return;
      await speakUntilDone(item.text, item.language);
      if (runId !== playbackRun.current || stoppedRef.current) return;
      await wait(1500, runId);
    }

    if (runId !== playbackRun.current || stoppedRef.current) return;
    setPlaying(false);
    setIndex((current) => (current + 1 >= cards.length ? 0 : current + 1));
  }

  function wait(ms: number, runId: number): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(resolve, ms);
      timers.current.push({ timer, resolve });
      if (runId !== playbackRun.current || stoppedRef.current) {
        clearTimeout(timer);
        resolve();
      }
    });
  }

  async function handlePlaybackPress() {
    if (playing) {
      stoppedRef.current = true;
      usingTrackPlayerRef.current = false;
      setPlaying(false);
      clearTimers();
      await stopDiscoveryPlayback();
      await stop();
      return;
    }

    stoppedRef.current = false;
    playSequence();
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
