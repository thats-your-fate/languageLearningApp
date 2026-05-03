import { StyleSheet, Text, useColorScheme, View } from "react-native";
import { useI18n } from "../i18n";
import { useAppTheme } from "../theme";
import { AppButton } from "./AppButton";

type Props = {
  label: string;
  prompt: string;
  answer?: string;
  example?: string;
  revealed?: boolean;
  onReveal?: () => void;
  onSpeak?: () => void;
};

export function FlashCard({ label, prompt, answer, example, revealed, onReveal, onSpeak }: Props) {
  const theme = useAppTheme();
  const { t } = useI18n();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.prompt, { color: theme.text }]}>{prompt}</Text>
      {revealed && answer ? (
        <View style={styles.answerBlock}>
          <Text style={[styles.answer, { color: theme.primary }]}>{answer}</Text>
          {example ? <Text style={[styles.example, { color: theme.textMuted }]}>{example}</Text> : null}
          {onSpeak ? <AppButton title={t("flashcard.playPronunciation")} variant="secondary" onPress={onSpeak} /> : null}
        </View>
      ) : onReveal ? (
        <AppButton title={t("flashcard.revealAnswer")} onPress={onReveal} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  answer: {
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center"
  },
  answerBlock: {
    gap: 14,
    marginTop: 16
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
    minHeight: 280,
    justifyContent: "center",
    padding: 24
  },
  example: {
    fontSize: 16,
    lineHeight: 23,
    textAlign: "center"
  },
  label: {
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center",
    textTransform: "uppercase"
  },
  prompt: {
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 40,
    textAlign: "center"
  }
});
