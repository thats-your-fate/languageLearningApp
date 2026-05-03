import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text, useColorScheme, View } from "react-native";
import { AppButton } from "../components/AppButton";
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
  const { t } = useI18n();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const rawCard = getCardById(route.params.cardId);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  if (!rawCard || !settings) {
    return (
      <Screen>
        <Text style={{ color: theme.text }}>{t("card.notFound")}</Text>
      </Screen>
    );
  }

  const card: PracticeCardView = toPracticeCardView(rawCard, settings.sourceLanguage, settings.targetLanguage);

  return (
    <Screen>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.topRow}>
          <LevelBadge level={card.level} />
          <Text style={[styles.meta, { color: theme.textMuted }]}>{card.partOfSpeech}</Text>
        </View>
        <Text style={[styles.target, { color: theme.text }]}>{card.targetText}</Text>
        <Text style={[styles.source, { color: theme.textMuted }]}>{card.sourceText}</Text>
        <Text style={[styles.meta, { color: theme.textMuted }]}>
          {card.category}
          {rawCard.subcategory ? ` · ${rawCard.subcategory}` : ""}
        </Text>
      </View>

      <InfoBlock title={t("card.meaning")} body={card.meaningLock} />
      <InfoBlock title={t("card.sourceExample")} body={card.sourceExample} />
      <InfoBlock title={t("card.targetExample")} body={card.targetExample} />

      <AppButton title={t("card.practiceWriting")} onPress={() => navigation.navigate("AiWritingPractice", { cardId: card.id })} />
      <AppButton title={t("card.practiceSpeaking")} variant="secondary" onPress={() => navigation.navigate("AiSpeakingPractice", { cardId: card.id })} />
      <AppButton title={t("card.regularPractice")} variant="secondary" onPress={() => navigation.navigate("Practice", {})} />
      <AppButton title={t("card.playPronunciation")} variant="secondary" onPress={() => speak(card.targetText, settings.targetLanguage)} />
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
