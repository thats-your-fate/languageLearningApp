import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { LanguagePairBadge } from "../components/LanguagePairBadge";
import { ProgressCard } from "../components/ProgressCard";
import { Screen } from "../components/Screen";
import { useI18n } from "../i18n";
import { RootStackParamList } from "../navigation/AppNavigator";
import { getProgressSummary } from "../services/progressService";
import { getSettings } from "../services/settingsService";
import { getAllCards } from "../services/vocabularyService";
import { useAppTheme } from "../theme";
import { ProgressSummary } from "../types/progress";
import { AppSettings } from "../types/vocabulary";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { t } = useI18n();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);

  useFocusEffect(
    useCallback(() => {
      getSettings().then(setSettings);
      getProgressSummary(getAllCards()).then(setSummary);
    }, [])
  );

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={[styles.logo, { color: theme.primary }]}>{t("app.name")}</Text>
        <Text style={[styles.title, { color: theme.text }]}>{t("home.subtitle")}</Text>
        {settings ? <LanguagePairBadge source={settings.sourceLanguage} target={settings.targetLanguage} /> : null}
      </View>

      <View style={styles.progressRow}>
        <ProgressCard label="Known words" value={summary?.knownWords ?? 0} />
        <ProgressCard label="Due today" value={summary?.dueCards ?? getAllCards().length} />
        <ProgressCard
          label="A1 progress"
          value={`${Math.round((summary?.levelProgress.A1 ?? 0) * 100)}%`}
        />
      </View>

      <AppButton title={t("home.startPractice")} onPress={() => navigation.navigate("PracticeHub")} />

      <View style={styles.grid}>
        <HomeTile title={t("common.wordList")} onPress={() => navigation.navigate("Learn")} />
        <HomeTile title={t("common.practiceHub")} onPress={() => navigation.navigate("PracticeHub")} />
        <HomeTile title={t("common.aiWriting")} onPress={() => navigation.navigate("AiWritingPractice", {})} />
        <HomeTile title={t("common.aiSpeaking")} onPress={() => navigation.navigate("AiSpeakingPractice", {})} />
        <HomeTile title={t("common.stats")} onPress={() => navigation.navigate("Stats")} />
        <HomeTile title={t("common.settings")} onPress={() => navigation.navigate("Settings")} />
      </View>
    </Screen>
  );
}

function HomeTile({ title, onPress }: { title: string; onPress: () => void }) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: theme.surface, borderColor: theme.border },
        pressed && styles.pressed
      ]}
    >
      <Text style={[styles.tileTitle, { color: theme.text }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  hero: {
    gap: 14
  },
  logo: {
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  pressed: {
    opacity: 0.8
  },
  progressRow: {
    flexDirection: "row",
    gap: 10
  },
  tile: {
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 82,
    justifyContent: "center",
    padding: 16,
    width: "48%"
  },
  tileTitle: {
    fontSize: 17,
    fontWeight: "900"
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 40
  }
});
