import { StyleSheet, Text, useColorScheme, View } from "react-native";
import { useAppTheme } from "../theme";
import { CEFRLevel } from "../types/vocabulary";

type Props = {
  level: CEFRLevel;
};

export function LevelBadge({ level }: Props) {
  const theme = useAppTheme();

  return (
    <View style={[styles.badge, { backgroundColor: theme.surfaceMuted }]}>
      <Text style={[styles.text, { color: theme.text }]}>{level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5
  },
  text: {
    fontSize: 12,
    fontWeight: "900"
  }
});
