import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { Screen } from "../components/Screen";
import { useI18n } from "../i18n";
import { RootStackParamList } from "../navigation/AppNavigator";
import { getAllProgress, isKnownProgress } from "../services/progressService";
import { getSettings } from "../services/settingsService";
import { speak } from "../services/ttsService";
import { getPracticeCards } from "../services/vocabularyService";
import { useAppTheme } from "../theme";
import { CardProgress } from "../types/progress";
import { AppSettings, LANGUAGE_LABELS, PracticeCardView } from "../types/vocabulary";

type Props = NativeStackScreenProps<RootStackParamList, "WordList">;

export function WordListScreen({ navigation, route }: Props) {
  const theme = useAppTheme();
  const { t } = useI18n();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [progress, setProgress] = useState<Record<string, CardProgress>>({});

  useFocusEffect(
    useCallback(() => {
      getSettings().then(setSettings);
      getAllProgress().then(setProgress);
    }, [])
  );

  const category = route.params?.category;
  const groupedCategories = route.params?.groupedCategories;
  const cards: PracticeCardView[] = settings
    ? getPracticeCards(settings.sourceLanguage, settings.targetLanguage).filter(
        (card) =>
          (settings.activeLevel === "All" || card.level === settings.activeLevel) &&
          (!category ||
            card.category === category ||
            Boolean(groupedCategories?.includes(card.category)))
      )
    : [];
  const knownInList = cards.filter((card) => isKnownProgress(progress[card.id])).length;
  const remainingInList = Math.max(cards.length - knownInList, 0);

  return (
    <Screen title={t("common.wordList")} backLabel={t("common.learn")} activeTab="Learn">
      <View style={styles.hero}>
        <Text style={[styles.title, { color: theme.text }]}>{category ?? "Word list"}</Text>
        <Text style={[styles.count, { color: theme.textMuted }]}>
          {settings?.activeLevel ?? "All"} · {settings ? LANGUAGE_LABELS[settings.targetLanguage] : "Learner language"} ·{" "}
          {t("wordList.counts", { left: remainingInList, known: knownInList, total: cards.length })}
        </Text>
        <Text style={[styles.helper, { color: theme.textMuted }]}>
          {t("wordList.knownHelper")}
        </Text>
      </View>
      <AppButton
        title={t("wordList.practiceThisList")}
        onPress={() => navigation.navigate("Practice", { category, groupedCategories })}
      />
      <AppButton
        title={t("wordList.practiceSentences")}
        onPress={() => navigation.navigate("SentencePractice", { category, groupedCategories })}
      />

      {settings
        ? cards.map((card) => (
            <Pressable
              accessibilityRole="button"
              key={card.id}
              onPress={() => navigation.navigate("CardDetail", { cardId: card.id })}
              style={({ pressed }) => [
                styles.wordCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
                pressed && styles.pressed
              ]}
            >
              <View style={styles.wordText}>
                <Text style={[styles.source, { color: theme.textMuted }]}>{card.sourceText}</Text>
                <Text style={[styles.target, { color: theme.text }]}>{card.targetText}</Text>
                <View style={styles.metaRow}>
                  <Text style={[styles.partOfSpeech, { color: theme.text, borderColor: theme.border }]}>
                    {card.partOfSpeech}
                  </Text>
                  <Text style={[styles.levelMeta, { color: theme.textMuted }]}>{card.level}</Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => speak(card.targetText, settings.targetLanguage)}
                style={[styles.sound, { backgroundColor: theme.soundButton }]}
              >
                <Ionicons name="volume-high" size={26} color={theme.text} />
              </Pressable>
            </Pressable>
          ))
        : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  count: {
    fontSize: 16,
    fontWeight: "500"
  },
  hero: {
    gap: 4,
    marginBottom: 8
  },
  helper: {
    fontSize: 13,
    fontWeight: "700"
  },
  pressed: {
    opacity: 0.8
  },
  levelMeta: {
    fontSize: 12,
    fontWeight: "900"
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 9
  },
  partOfSpeech: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 13,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5,
    textTransform: "lowercase"
  },
  sound: {
    alignItems: "center",
    borderRadius: 28,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  source: {
    fontSize: 16,
    fontWeight: "500"
  },
  target: {
    fontSize: 21,
    fontWeight: "900",
    marginTop: 8
  },
  title: {
    fontSize: 30,
    fontWeight: "900"
  },
  wordCard: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 88,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  wordText: {
    flex: 1,
    paddingRight: 16
  }
});
