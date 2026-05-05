import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { LearnerBadge } from "../components/LearnerBadge";
import { Screen } from "../components/Screen";
import { useI18n } from "../i18n";
import { RootStackParamList } from "../navigation/AppNavigator";
import { evaluateSpeakingAnswerStream } from "../services/aiPracticeService";
import * as speechService from "../services/speechService";
import { getSettings } from "../services/settingsService";
import { getCardById, getRandomCard, toPracticeCardView } from "../services/vocabularyService";
import { useAppTheme } from "../theme";
import { AiPracticeResult } from "../types/aiPractice";
import { AppSettings, LANGUAGE_LABELS, PracticeCardView } from "../types/vocabulary";

type Props = NativeStackScreenProps<RootStackParamList, "AiSpeakingPractice">;

export function AiSpeakingPracticeScreen({ navigation, route }: Props) {
  const theme = useAppTheme();
  const { t } = useI18n();
  const tokenBuffer = useRef("");
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [card, setCard] = useState<PracticeCardView | null>(null);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("Record your voice or type the transcript.");
  const [result, setResult] = useState<AiPracticeResult | null>(null);
  const [streamedFeedback, setStreamedFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    getSettings().then((saved) => {
      setSettings(saved);
      const raw = route.params?.cardId ? getCardById(route.params.cardId) : null;
      setCard(raw ? toPracticeCardView(raw, saved.sourceLanguage, saved.targetLanguage) : getRandomCard(saved.sourceLanguage, saved.targetLanguage, saved.activeLevel));
    });

    return () => {
      clearStreamBuffer();
    };
  }, [route.params?.cardId]);

  async function handleRecordingPress() {
    if (!settings || !card || loading) return;
    if (recording) {
      await finishRecordingAndSubmit();
      return;
    }

    if (transcript.trim()) {
      await submit();
      return;
    }

    try {
      setResult(null);
      setStreamedFeedback("");
      setTranscript("");
      await speechService.startListening(settings.targetLanguage);
      setRecording(true);
      setStatus("Listening...");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Speech recognition is unavailable.");
    }
  }

  async function finishRecordingAndSubmit() {
    if (!settings || !card) return;
    try {
      setLoading(true);
      setStatus("Transcribing...");
      const nextTranscript = await speechService.stopListening();
      setRecording(false);
      setTranscript(nextTranscript);
      setStatus("Checking...");
      await runStreamingCheck(nextTranscript);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Use typed transcript fallback.");
    } finally {
      setRecording(false);
      setLoading(false);
    }
  }

  async function submit() {
    if (!card || !settings) return;
    try {
      setLoading(true);
      setStatus("Checking...");
      await runStreamingCheck(transcript);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Speaking evaluation failed.");
    } finally {
      setLoading(false);
    }
  }

  function nextCard() {
    if (!settings) return;
    clearStreamBuffer();
    setResult(null);
    setStreamedFeedback("");
    setTranscript("");
    setRecording(false);
    setStatus("Record your voice or type the transcript.");
    setCard(getRandomCard(settings.sourceLanguage, settings.targetLanguage, settings.activeLevel));
  }

  async function runStreamingCheck(nextTranscript: string) {
    if (!card || !settings) return;
    clearStreamBuffer();
    setResult(null);
    setStreamedFeedback("");
    setLoading(true);
    let gotStream = false;
    const nextResult = await evaluateSpeakingAnswerStream(
      card,
      nextTranscript,
      settings.targetLanguage,
      (token) => {
        gotStream = true;
        enqueueStreamToken(token);
      },
      (partialResult) => {
        setResult(partialResult);
      }
    );
    flushStreamBuffer();
    setResult(nextResult);
    if (!gotStream) {
      setStreamedFeedback(formatResultFeedback(nextResult));
    }
    setStatus("Checked.");
    setLoading(false);
  }

  function enqueueStreamToken(token: string) {
    tokenBuffer.current += token;
    if (!flushTimer.current) {
      flushTimer.current = setTimeout(flushStreamBuffer, 48);
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
  }

  function primaryActionTitle() {
    if (recording) return t("aiSpeaking.submitRecording");
    if (transcript.trim()) return t("aiSpeaking.submitTranscript");
    return t("aiSpeaking.startRecording");
  }

  if (!settings || !card) {
    return (
      <Screen title={t("aiSpeaking.title")} backLabel={t("common.practice")} activeTab="Practice">
        <Text style={{ color: theme.text }}>{t("aiSpeaking.loading")}</Text>
      </Screen>
    );
  }

  return (
    <Screen
      title={t("aiSpeaking.title")}
      backLabel={t("common.practice")}
      activeTab="Practice"
      headerRight={<LearnerBadge settings={settings} onPress={() => navigation.navigate("Onboarding", { settings })} />}
    >
      <View style={[styles.promptCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.label, { color: theme.textMuted }]}>
          {t("aiSpeaking.speakSentence")} · {LANGUAGE_LABELS[settings.targetLanguage]}
        </Text>
        <Text style={[styles.word, { color: theme.text }]}>{card.targetText}</Text>
        <Text style={[styles.sentence, { color: theme.text }]}>{card.targetExample}</Text>
        <Text style={[styles.translation, { color: theme.textMuted }]}>{card.sourceExample}</Text>
        <Text style={[styles.helper, { color: theme.textMuted }]}>{status}</Text>
      </View>
      <TextInput
        multiline
        placeholder={t("aiSpeaking.transcriptPlaceholder")}
        placeholderTextColor={theme.textMuted}
        value={transcript}
        onChangeText={setTranscript}
        style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
      />
      <AppButton
        title={primaryActionTitle()}
        onPress={handleRecordingPress}
      />
      {result || streamedFeedback || loading ? (
        <View style={[styles.resultCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.scoreRow}>
            <Text style={[styles.score, { color: result ? (result.score >= 0.8 ? theme.success : "#ffd166") : theme.textMuted }]}>
              {result ? `Score: ${Math.round(result.score * 100)}%` : "Score: checking..."}
            </Text>
            {loading && !result ? <ActivityIndicator color={theme.primary} /> : null}
          </View>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
            {t(result?.source === "fallback" ? "aiWriting.offlineFeedback" : "aiWriting.feedback")}
          </Text>
          {result?.source === "fallback" && result.offlineReason ? (
            <Text style={[styles.offlineReason, { color: theme.textMuted }]}>{result.offlineReason}</Text>
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
        </View>
      ) : null}
      <AppButton title={t("discovery.nextCard")} variant="secondary" onPress={nextCard} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  helper: {
    fontSize: 14,
    lineHeight: 20
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 100,
    padding: 14,
    textAlignVertical: "top"
  },
  label: {
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  promptCard: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 20
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
  sentence: {
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 28
  },
  streamed: {
    fontSize: 17,
    lineHeight: 24
  },
  streamedIssue: {
    fontSize: 20,
    lineHeight: 28
  },
  translation: {
    fontSize: 15,
    lineHeight: 21
  },
  word: {
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36
  }
});

function formatResultFeedback(result: AiPracticeResult) {
  return [
    result.feedback,
    result.grammarNotes.length > 0 ? `\n\nGrammar notes\n${result.grammarNotes.map((note) => `• ${note}`).join("\n")}` : ""
  ]
    .filter(Boolean)
    .join("");
}
