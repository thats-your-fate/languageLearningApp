import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";
import { LearnerBadge } from "../components/LearnerBadge";
import { Screen } from "../components/Screen";
import { useI18n } from "../i18n";
import { RootStackParamList } from "../navigation/AppNavigator";
import { getAllProgress, isKnownProgress, isWeakProgress } from "../services/progressService";
import { getSettings } from "../services/settingsService";
import { getPracticeCards } from "../services/vocabularyService";
import { useAppTheme } from "../theme";
import { CardProgress, DifficultyGrade } from "../types/progress";
import { AppSettings } from "../types/vocabulary";

type Props = NativeStackScreenProps<RootStackParamList, "Stats">;

const gradeColors: Record<DifficultyGrade, string> = {
  again: "#ad1d1d",
  hard: "#c65a00",
  good: "#2854d9",
  easy: "#08704f"
};

export function StatsScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { gradeName, t } = useI18n();
  const [progress, setProgress] = useState<Record<string, CardProgress>>({});
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useFocusEffect(
    useCallback(() => {
      getAllProgress().then(setProgress);
      getSettings().then(setSettings);
    }, [])
  );

  const availableCards = settings
    ? getPracticeCards(settings.sourceLanguage, settings.targetLanguage).filter(
        (card) => settings.activeLevel === "All" || card.level === settings.activeLevel
      )
    : [];
  const availableIds = new Set(availableCards.map((card) => card.id));
  const values = Object.values(progress).filter((item) => availableIds.size === 0 || availableIds.has(item.cardId));
  const today = new Date().toDateString();
  const practicedToday = values.reduce(
    (count, item) =>
      count +
      (item.reviewHistory ?? []).filter((review) => new Date(review.reviewedAt).toDateString() === today).length,
    0
  );
  const knownCards = values.filter(isKnownProgress).length;
  const weakCards = values.filter(isWeakProgress).length;
  const gradeCounts: Record<DifficultyGrade, number> = {
    again: values.filter((item) => item.grade === "again").length,
    hard: values.filter((item) => item.grade === "hard").length,
    good: values.filter((item) => item.grade === "good").length,
    easy: values.filter((item) => item.grade === "easy").length
  };

  return (
    <Screen
      title={t("common.stats")}
      activeTab="Stats"
      headerRight={
        settings ? (
          <LearnerBadge settings={settings} onPress={() => navigation.navigate("Onboarding", { settings })} />
        ) : undefined
      }
    >
      <Text style={[styles.title, { color: theme.text }]}>{t("common.stats")}</Text>
      <MetricCard title={t("stats.cardsToday")} value={practicedToday} />
      <MetricCard
        title={t("stats.knownCards")}
        value={knownCards}
        helper={t("stats.knownHelper")}
        highlighted
        onPress={() => navigation.navigate("Practice", { practiceSet: "known" })}
      />

      <View style={[styles.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.panelTitle, { color: theme.textMuted }]}>{t("stats.byGrade")}</Text>
        <View style={styles.gradeGrid}>
          {(["again", "hard", "good", "easy"] as DifficultyGrade[]).map((grade) => (
            <Pressable
              accessibilityRole="button"
              key={grade}
              onPress={() => navigation.navigate("Practice", { grade })}
              style={[styles.gradeCard, { backgroundColor: gradeColors[grade] }]}
            >
              <Text style={styles.gradeLabel}>{gradeName(grade)}</Text>
              <Text style={styles.gradeValue}>{gradeCounts[grade]}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.helper, { color: theme.textMuted }]}>{t("stats.gradeHelper")}</Text>
      </View>

      <MetricCard
        title={t("stats.weakCards")}
        value={weakCards}
        helper={t("stats.weakHelper")}
        highlighted
        onPress={() => navigation.navigate("Practice", { practiceSet: "weak" })}
      />
    </Screen>
  );
}

function MetricCard({
  title,
  value,
  helper,
  highlighted,
  onPress
}: {
  title: string;
  value: number;
  helper?: string;
  highlighted?: boolean;
  onPress?: () => void;
}) {
  const theme = useAppTheme();
  const content = (
    <>
      <Text style={[styles.metricTitle, { color: theme.textMuted }]}>{title}</Text>
      <Text style={[styles.metricValue, { color: theme.text }]}>{value}</Text>
      {helper ? <Text style={[styles.helper, { color: theme.textMuted }]}>{helper}</Text> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={[styles.metric, { backgroundColor: theme.surface, borderColor: highlighted ? "#8fc4ff" : theme.border }]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.metric, { backgroundColor: theme.surface, borderColor: theme.border }]}>{content}</View>;
}

const styles = StyleSheet.create({
  gradeCard: {
    borderRadius: 10,
    flex: 1,
    minHeight: 58,
    minWidth: "47%",
    paddingHorizontal: 11,
    paddingVertical: 9
  },
  gradeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  gradeLabel: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900"
  },
  gradeValue: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 6
  },
  helper: {
    fontSize: 13,
    lineHeight: 17
  },
  metric: {
    borderRadius: 15,
    borderWidth: 1,
    gap: 5,
    minHeight: 78,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: "800"
  },
  metricValue: {
    fontSize: 30,
    fontWeight: "900"
  },
  panel: {
    borderRadius: 15,
    borderWidth: 1,
    gap: 9,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: "900"
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 30,
    marginBottom: -2
  }
});
