import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";
import { LearnerBadge } from "../components/LearnerBadge";
import { Screen } from "../components/Screen";
import { useI18n } from "../i18n";
import { RootStackParamList } from "../navigation/AppNavigator";
import { getAllProgress, isKnownProgress } from "../services/progressService";
import { getSettings } from "../services/settingsService";
import { getPracticeCards } from "../services/vocabularyService";
import { useAppTheme } from "../theme";
import { CardProgress } from "../types/progress";
import { AppSettings } from "../types/vocabulary";

type Props = NativeStackScreenProps<RootStackParamList, "Learn">;

const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  Communication: "chatbubbles-outline",
  "Daily life": "sunny-outline",
  Description: "color-palette-outline",
  Food: "restaurant-outline",
  Health: "medkit-outline",
  Home: "home-outline",
  Learning: "school-outline",
  Nature: "leaf-outline",
  People: "people-outline",
  School: "library-outline",
  Shopping: "bag-outline",
  Time: "time-outline",
  Travel: "airplane-outline",
  Work: "briefcase-outline"
};

export function LearnScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { categoryName, languageName, t } = useI18n();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [progress, setProgress] = useState<Record<string, CardProgress>>({});

  useFocusEffect(
    useCallback(() => {
      getSettings().then(setSettings);
      getAllProgress().then(setProgress);
    }, [])
  );

  const categories = useMemo(() => {
    if (!settings) return [];
    const cards = getPracticeCards(settings.sourceLanguage, settings.targetLanguage).filter(
      (card) => settings.activeLevel === "All" || card.level === settings.activeLevel
    );
    const rawGrouped = new Map<string, { category: string; count: number; known: number; sourceCategories: string[] }>();
    cards.forEach((card) => {
      const current = rawGrouped.get(card.category) ?? {
        category: card.category,
        count: 0,
        known: 0,
        sourceCategories: [card.category]
      };
      current.count += 1;
      current.known += isKnownProgress(progress[card.id]) ? 1 : 0;
      rawGrouped.set(card.category, current);
    });
    const allGroups = Array.from(rawGrouped.values());
    const generalSource = allGroups.filter((item) => item.category === "General" || item.count < 10);
    const large = allGroups.filter((item) => item.category !== "General" && item.count >= 10);
    const general =
      generalSource.length > 0
        ? [
            {
              category: "General",
              count: generalSource.reduce((sum, item) => sum + item.count, 0),
              known: generalSource.reduce((sum, item) => sum + item.known, 0),
              sourceCategories: Array.from(new Set(generalSource.map((item) => item.category)))
            }
          ]
        : [];
    return [...large, ...general].sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
  }, [progress, settings]);

  return (
    <Screen
      title={t("common.learn")}
      activeTab="Learn"
      headerRight={
        settings ? (
          <LearnerBadge settings={settings} onPress={() => navigation.navigate("Onboarding", { settings })} />
        ) : undefined
      }
    >
      <View style={styles.hero}>
        <Text style={[styles.title, { color: theme.text }]}>{t("learn.chooseCategory")}</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          {settings?.activeLevel ?? "All"} · {settings ? languageName(settings.targetLanguage) : "Learner language"}
        </Text>
      </View>
      <View style={styles.grid}>
        {categories.map((item) => (
          <Pressable
            accessibilityRole="button"
            key={item.category}
            onPress={() =>
              navigation.navigate("WordList", {
                category: item.category,
                groupedCategories: item.category === "General" ? item.sourceCategories : undefined
              })
            }
            style={({ pressed }) => [
              styles.tile,
              { backgroundColor: theme.surface, borderColor: theme.border },
              pressed && styles.pressed
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: theme.surfaceMuted }]}>
              <Ionicons name={categoryIcons[item.category] ?? "albums-outline"} size={25} color={theme.primary} />
            </View>
            <Text numberOfLines={2} style={[styles.tileTitle, { color: theme.text }]}>
              {categoryName(item.category)}
            </Text>
            <Text style={[styles.tileMeta, { color: theme.textMuted }]}>
              {t("learn.leftKnown", { left: Math.max(item.count - item.known, 0), known: item.known })}
            </Text>
            <Text style={[styles.tileAction, { color: theme.primary }]}>{t("learn.openList")}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
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
  pressed: {
    opacity: 0.8
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "800"
  },
  tile: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    minHeight: 150,
    padding: 14,
    width: "48%"
  },
  tileAction: {
    fontSize: 13,
    fontWeight: "900",
    marginTop: "auto"
  },
  tileMeta: {
    fontSize: 13,
    fontWeight: "700"
  },
  tileTitle: {
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 22
  },
  title: {
    fontSize: 30,
    fontWeight: "900"
  }
});
