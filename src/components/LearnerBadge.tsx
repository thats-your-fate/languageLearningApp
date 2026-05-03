import { Pressable, StyleSheet, Text, useColorScheme } from "react-native";
import { useAppTheme } from "../theme";
import { AppSettings, LanguageCode } from "../types/vocabulary";

const flags: Record<LanguageCode, string> = {
  en: "🇬🇧",
  de: "🇩🇪",
  "pt-BR": "🇧🇷",
  it: "🇮🇹",
  es: "🇪🇸",
  fr: "🇫🇷"
};

type Props = {
  settings: AppSettings;
  onPress?: () => void;
};

export function LearnerBadge({ settings, onPress }: Props) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={[styles.badge, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}
    >
      <Text style={[styles.text, { color: theme.text }]}>
        {flags[settings.targetLanguage]} {settings.activeLevel}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
    minHeight: 46,
    justifyContent: "center",
    paddingHorizontal: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18
  },
  text: {
    fontSize: 14,
    fontWeight: "900"
  }
});
