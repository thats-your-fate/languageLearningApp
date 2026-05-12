import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../theme";
import { AnswerFeedback } from "../services/feedbackService";

type Props = {
  feedback: AnswerFeedback | null;
  revealedMessage?: string;
};

export function AnswerFeedbackBanner({ feedback, revealedMessage = "Answer revealed." }: Props) {
  const theme = useAppTheme();
  const kind = feedback?.kind ?? "exact";
  const accentColor = feedback
    ? kind === "fail"
      ? theme.danger
      : kind === "close"
        ? theme.warning
        : theme.success
    : theme.success;
  const isFail = feedback?.kind === "fail";
  const color = isFail
    ? theme.danger
    : feedback
      ? kind === "close"
        ? theme.warning
        : theme.success
      : theme.success;

  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: accentColor }]}>
        <Ionicons name={feedback?.icon ?? "eye"} size={23} color="#ffffff" />
      </View>
      <Text style={[styles.text, { color }]}>{feedback?.message ?? revealedMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    alignItems: "center",
    borderRadius: 24,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minHeight: 40
  },
  text: {
    flex: 1,
    fontSize: 18,
    fontWeight: "900"
  }
});
