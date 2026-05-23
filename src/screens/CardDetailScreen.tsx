import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { LearnerBadge } from "../components/LearnerBadge";
import { LevelBadge } from "../components/LevelBadge";
import { Screen } from "../components/Screen";
import { useI18n } from "../i18n";
import { RootStackParamList } from "../navigation/AppNavigator";
import { getSettings } from "../services/settingsService";
import { speak } from "../services/ttsService";
import { getCardById, toPracticeCardView } from "../services/vocabularyService";
import { useAppTheme } from "../theme";
import { AppSettings, PracticeCardView } from "../types/vocabulary";
import { useEffect, useState } from "react";

type Props = NativeStackScreenProps<RootStackParamList, "CardDetail">;

export function CardDetailScreen({ navigation, route }: Props) {
  const theme = useAppTheme();
  const { categoryName, t } = useI18n();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const rawCard = getCardById(route.params.cardId);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  if (!rawCard || !settings) {
    return (
      <Screen title={t("card.details")} backLabel={t("common.wordList")} activeTab="Learn">
        <Text style={{ color: theme.text }}>{t("card.notFound")}</Text>
      </Screen>
    );
  }

  const card: PracticeCardView = toPracticeCardView(rawCard, settings.sourceLanguage, settings.targetLanguage);

  return (
    <Screen
      title={t("card.details")}
      backLabel={t("common.wordList")}
      activeTab="Learn"
      headerRight={<LearnerBadge settings={settings} onPress={() => navigation.navigate("Onboarding", { settings })} />}
    >
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.topRow}>
          <LevelBadge level={card.level} />
          <Text style={[styles.partOfSpeech, { color: theme.text, borderColor: theme.border }]}>{card.partOfSpeech}</Text>
        </View>
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{t("card.learningWord")}</Text>
        <Text style={[styles.target, { color: theme.text }]}>{card.targetText}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => speak(card.targetText, settings.targetLanguage)}
          style={[styles.soundInline, { backgroundColor: theme.soundButton }]}
        >
          <Ionicons name="volume-high" size={20} color={theme.text} />
          <Text style={[styles.soundText, { color: theme.text }]}>{t("card.playPronunciation")}</Text>
        </Pressable>
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{t("card.nativeMeaning")}</Text>
        <Text style={[styles.source, { color: theme.textMuted }]}>{card.sourceText}</Text>
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{t("card.category")}</Text>
        <Text style={[styles.meta, { color: theme.textMuted }]}>
          {categoryName(card.category)}
          {rawCard.subcategory ? ` · ${categoryName(rawCard.subcategory)}` : ""}
        </Text>
      </View>

      <InfoBlock title={t("card.meaning")} body={card.meaningLock} />
      <Text style={[styles.groupTitle, { color: theme.text }]}>{t("card.examples")}</Text>
      <InfoBlock title={t("card.sourceExample")} body={card.sourceExample} />
      <InfoBlock title={t("card.targetExample")} body={card.targetExample} />

      <AppButton title={t("card.practiceWriting")} onPress={() => navigation.navigate("AiWritingPractice", { cardId: card.id })} />
      <AppButton title={t("card.practiceSpeaking")} onPress={() => navigation.navigate("AiSpeakingPractice", { cardId: card.id })} />
      <AppButton title={t("card.regularPractice")} onPress={() => navigation.navigate("Practice", {})} />
    </Screen>
  );
}

function InfoBlock({ title, body }: { title: string; body: string }) {
  const theme = useAppTheme();
  return (
    <View style={[styles.info, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.infoTitle, { color: theme.textMuted }]}>{title}</Text>
      <Text style={[styles.infoBody, { color: theme.text }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 20
  },
  info: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 16
  },
  infoBody: {
    fontSize: 17,
    lineHeight: 24
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  meta: {
    fontSize: 14,
    fontWeight: "700"
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4
  },
  partOfSpeech: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 14,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 7,
    textTransform: "lowercase"
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 4,
    textTransform: "uppercase"
  },
  soundInline: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    flexDirection: "row",
    gap: 7,
    marginBottom: 4,
    minHeight: 38,
    paddingHorizontal: 12
  },
  soundText: {
    fontSize: 13,
    fontWeight: "900"
  },
  source: {
    fontSize: 20,
    fontWeight: "800"
  },
  target: {
    fontSize: 40,
    fontWeight: "900"
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  }
});
