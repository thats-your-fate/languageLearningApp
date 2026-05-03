import { StyleSheet, Text, useColorScheme, View } from "react-native";
import { useAppTheme } from "../theme";

type Props = {
  label: string;
  value: string | number;
  helper?: string;
};

export function ProgressCard({ label, value, helper }: Props) {
  const theme = useAppTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      {helper ? <Text style={[styles.helper, { color: theme.textMuted }]}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    minWidth: "30%",
    padding: 16
  },
  helper: {
    fontSize: 12,
    marginTop: 8
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4
  },
  value: {
    fontSize: 26,
    fontWeight: "900"
  }
});
