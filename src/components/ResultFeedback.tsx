import { StyleSheet, Text, useColorScheme, View } from "react-native";
import { useI18n } from "../i18n";
import { useAppTheme } from "../theme";
import { AiPracticeResult } from "../types/aiPractice";

type Props = {
  result: AiPracticeResult;
};

export function ResultFeedback({ result }: Props) {
  const theme = useAppTheme();
  const { t } = useI18n();
  const percent = Math.round(result.score * 100);

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.score, { color: result.isCorrect ? theme.success : theme.primary }]}>{percent}%</Text>
      <Text style={[styles.feedback, { color: theme.text }]}>{result.feedback}</Text>
      <Text style={[styles.label, { color: theme.textMuted }]}>{t("result.exampleSentence")}</Text>
      <Text style={[styles.correction, { color: theme.text }]}>{result.correctedAnswer}</Text>
      {result.hint ? <Text style={[styles.hint, { color: theme.textMuted }]}>{result.hint}</Text> : null}
      {result.grammarNotes.length > 0 ? (
        <View style={styles.notes}>
          {result.grammarNotes.map((note) => (
            <Text key={note} style={[styles.note, { color: theme.textMuted }]}>
              {note}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 18
  },
  correction: {
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 25
  },
  feedback: {
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 24
  },
  hint: {
    fontSize: 14,
    lineHeight: 20
  },
  label: {
    fontSize: 12,
    fontWeight: "900",
    marginTop: 8,
    textTransform: "uppercase"
  },
  note: {
    fontSize: 14,
    lineHeight: 20
  },
  notes: {
    gap: 4,
    marginTop: 4
  },
  score: {
    fontSize: 32,
    fontWeight: "900"
  }
});
