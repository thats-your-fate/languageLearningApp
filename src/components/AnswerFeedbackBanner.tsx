import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, useColorScheme, View } from "react-native";
import { useAppTheme } from "../theme";
import { AnswerFeedback } from "../services/feedbackService";

type Props = {
  feedback: AnswerFeedback | null;
  revealedMessage?: string;
};

export function AnswerFeedbackBanner({ feedback, revealedMessage = "Answer revealed." }: Props) {
  const theme = useAppTheme();
  const kind = feedback?.kind ?? "exact";
  const backgroundColor = feedback
    ? kind === "fail"
      ? theme.danger
      : kind === "close"
        ? theme.warning
        : theme.success
    : theme.success;
  const color = feedback
    ? kind === "fail"
      ? "#ff9a9a"
      : kind === "close"
        ? "#ffd166"
        : "#6ff0bd"
    : "#6ff0bd";

  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor }]}>
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
    gap: 12
  },
  text: {
    flex: 1,
    fontSize: 18,
    fontWeight: "900"
  }
});
