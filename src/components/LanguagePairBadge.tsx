import { StyleSheet, Text, useColorScheme, View } from "react-native";
import { useAppTheme } from "../theme";
import { LANGUAGE_LABELS, LanguageCode } from "../types/vocabulary";

type Props = {
  source: LanguageCode;
  target: LanguageCode;
};

export function LanguagePairBadge({ source, target }: Props) {
  const theme = useAppTheme();

  return (
    <View style={[styles.badge, { backgroundColor: theme.surfaceMuted }]}>
      <Text style={[styles.text, { color: theme.text }]}>
        {LANGUAGE_LABELS[source]} → {LANGUAGE_LABELS[target]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  text: {
    fontSize: 14,
    fontWeight: "800"
  }
});
