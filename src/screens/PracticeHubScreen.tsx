import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";
import { LearnerBadge } from "../components/LearnerBadge";
import { Screen } from "../components/Screen";
import { useI18n } from "../i18n";
import { RootStackParamList } from "../navigation/AppNavigator";
import { getSettings } from "../services/settingsService";
import { useAppTheme } from "../theme";
import { AppSettings } from "../types/vocabulary";

type Props = NativeStackScreenProps<RootStackParamList, "PracticeHub">;

const activities = [
  {
    titleKey: "practiceHub.discoveryTitle",
    descriptionKey: "practiceHub.discoveryDescription",
    icon: "play-circle-outline" as const,
    route: "DiscoveryPractice" as const
  },
  {
    titleKey: "practiceHub.writingTitle",
    descriptionKey: "practiceHub.writingDescription",
    icon: "create-outline" as const,
    route: "AiWritingPractice" as const
  },
  {
    titleKey: "practiceHub.speakingTitle",
    descriptionKey: "practiceHub.speakingDescription",
    icon: "mic-outline" as const,
    route: "AiSpeakingPractice" as const
  },
  {
    titleKey: "practiceHub.flashcardsTitle",
    descriptionKey: "practiceHub.flashcardsDescription",
    icon: "pencil-outline" as const,
    route: "SentencePractice" as const
  }
];

export function PracticeHubScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { t } = useI18n();
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  return (
    <Screen
      title={t("common.practice")}
      activeTab="Practice"
      style={styles.screen}
      headerRight={
        settings ? <LearnerBadge settings={settings} onPress={() => navigation.navigate("Onboarding", { settings })} /> : undefined
      }
    >
      <View style={styles.hero}>
        <Text style={[styles.title, { color: theme.text }]}>{t("practiceHub.title")}</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>{t("practiceHub.subtitle")}</Text>
      </View>
      <View style={styles.list}>
        {activities.map((activity) => (
          <Pressable
            accessibilityRole="button"
            key={activity.titleKey}
            onPress={() => {
              if (activity.route === "DiscoveryPractice") navigation.navigate("DiscoveryPractice");
              if (activity.route === "AiWritingPractice") navigation.navigate("AiWritingPractice", {});
              if (activity.route === "AiSpeakingPractice") navigation.navigate("AiSpeakingPractice", {});
              if (activity.route === "SentencePractice") navigation.navigate("SentencePractice");
            }}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: theme.surface, borderColor: theme.border },
              pressed && styles.pressed
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: theme.surfaceMuted }]}>
              <Ionicons name={activity.icon} size={26} color={theme.primary} />
            </View>
            <View style={styles.cardCopy}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{t(activity.titleKey as never)}</Text>
              <Text style={[styles.description, { color: theme.textMuted }]}>{t(activity.descriptionKey as never)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={theme.textMuted} />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    flex: 1,
    minHeight: 112,
    padding: 16,
    width: "100%"
  },
  cardCopy: {
    flex: 1,
    gap: 4
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 22
  },
  description: {
    fontSize: 13,
    lineHeight: 18
  },
  hero: {
    gap: 4
  },
  iconWrap: {
    alignItems: "center",
    borderRadius: 18,
    height: 46,
    justifyContent: "center",
    width: 46
  },
  list: {
    flex: 1,
    gap: 12,
    justifyContent: "space-between"
  },
  pressed: {
    opacity: 0.8
  },
  screen: {
    flexGrow: 1,
    minHeight: 620
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 20,
    marginTop: -6
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 34
  }
});
