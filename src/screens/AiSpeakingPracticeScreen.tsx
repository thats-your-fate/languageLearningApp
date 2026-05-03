import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, useColorScheme, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { LearnerBadge } from "../components/LearnerBadge";
import { ResultFeedback } from "../components/ResultFeedback";
import { Screen } from "../components/Screen";
import { useI18n } from "../i18n";
import { RootStackParamList } from "../navigation/AppNavigator";
import { evaluateSpeakingAnswer } from "../services/aiPracticeService";
import * as speechService from "../services/speechService";
import { getSettings } from "../services/settingsService";
import { speak } from "../services/ttsService";
import { getCardById, getRandomCard, toPracticeCardView } from "../services/vocabularyService";
import { useAppTheme } from "../theme";
import { AiPracticeResult } from "../types/aiPractice";
import { AppSettings, PracticeCardView } from "../types/vocabulary";

type Props = NativeStackScreenProps<RootStackParamList, "AiSpeakingPractice">;

export function AiSpeakingPracticeScreen({ navigation, route }: Props) {
  const theme = useAppTheme();
  const { t } = useI18n();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [card, setCard] = useState<PracticeCardView | null>(null);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("Typed transcript fallback is available.");
  const [result, setResult] = useState<AiPracticeResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSettings().then((saved) => {
      setSettings(saved);
      const raw = route.params?.cardId ? getCardById(route.params.cardId) : null;
      setCard(raw ? toPracticeCardView(raw, saved.sourceLanguage, saved.targetLanguage) : getRandomCard(saved.sourceLanguage, saved.targetLanguage, saved.activeLevel));
    });
  }, [route.params?.cardId]);

  async function startRecording() {
    if (!settings) return;
    try {
      await speechService.startListening(settings.targetLanguage);
      setStatus("Listening...");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Speech recognition is unavailable.");
    }
  }

  async function stopRecording() {
    try {
      setTranscript(await speechService.stopListening());
      setStatus("Transcript captured.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Use typed transcript fallback.");
    }
  }

  async function submit() {
    if (!card || !settings) return;
    setLoading(true);
    setResult(await evaluateSpeakingAnswer(card, transcript, settings.targetLanguage));
    setLoading(false);
  }

  function nextCard() {
    if (!settings) return;
    setResult(null);
    setTranscript("");
    setCard(getRandomCard(settings.sourceLanguage, settings.targetLanguage, settings.activeLevel));
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
        <Text style={[styles.label, { color: theme.textMuted }]}>{t("aiSpeaking.speakSentence")}</Text>
        <Text style={[styles.sentence, { color: theme.text }]}>{card.targetExample}</Text>
        <Text style={[styles.helper, { color: theme.textMuted }]}>{status}</Text>
      </View>
      <View style={styles.row}>
        <AppButton title={t("aiSpeaking.startRecording")} variant="secondary" onPress={startRecording} style={styles.rowButton} />
        <AppButton title={t("common.stop")} variant="secondary" onPress={stopRecording} style={styles.rowButton} />
      </View>
      <TextInput
        multiline
        placeholder={t("aiSpeaking.transcriptPlaceholder")}
        placeholderTextColor={theme.textMuted}
        value={transcript}
        onChangeText={setTranscript}
        style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
      />
      <AppButton title={t("aiSpeaking.submitTranscript")} onPress={submit} />
      <AppButton title={t("aiSpeaking.playCorrect")} variant="secondary" onPress={() => speak(card.targetExample, settings.targetLanguage)} />
      {loading ? <ActivityIndicator color={theme.primary} /> : null}
      {result ? <ResultFeedback result={result} /> : null}
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
  row: {
    flexDirection: "row",
    gap: 10
  },
  rowButton: {
    flex: 1
  },
  sentence: {
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 36
  }
});
