import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { useI18n } from "../i18n";
import { Screen } from "../components/Screen";
import { RootStackParamList } from "../navigation/AppNavigator";
import { saveSettings } from "../services/settingsService";
import { getAvailableStarterLevels } from "../services/vocabularyService";
import { useAppTheme } from "../theme";
import {
  AppSettings,
  LanguageCode,
  STARTER_LEVELS,
  StarterLevel,
  SUPPORTED_LANGUAGES
} from "../types/vocabulary";

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

const flags: Record<LanguageCode, string> = {
  en: "🇬🇧",
  de: "🇩🇪",
  "pt-BR": "🇧🇷",
  it: "🇮🇹",
  es: "🇪🇸",
  fr: "🇫🇷"
};

export function OnboardingScreen({ navigation, route }: Props) {
  const theme = useAppTheme();
  const { languageName, setLanguage, t } = useI18n();
  const [step, setStep] = useState(0);
  const initial = route.params?.settings;
  const [sourceLanguage, setSourceLanguage] = useState<LanguageCode>(initial?.sourceLanguage ?? "en");
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>(initial?.targetLanguage ?? "pt-BR");
  const [activeLevel, setActiveLevel] = useState<StarterLevel>(initial?.activeLevel === "All" ? "A1" : initial?.activeLevel ?? "A1");
  const availableLevels = getAvailableStarterLevels().length ? getAvailableStarterLevels() : STARTER_LEVELS;

  async function finish() {
    const nextSettings: AppSettings = {
      ...(initial ?? {
        themeMode: "dark",
        aiFeedbackLanguage: "mixed",
        autoPlayAudio: false,
        enableAiExplanations: true
      }),
      sourceLanguage,
      targetLanguage,
      activeLevel,
      hasCompletedOnboarding: true
    };
    await saveSettings(nextSettings);
    setLanguage(sourceLanguage);
    navigation.reset({ index: 0, routes: [{ name: "Learn" }] });
  }

  const title = step === 0 ? t("onboarding.iSpeak") : step === 1 ? t("onboarding.iWantToLearn") : t("onboarding.myLevel");
  const subtitle =
    step === 0
      ? t("onboarding.sourceSubtitle")
      : step === 1
        ? t("onboarding.targetSubtitle")
        : t("onboarding.levelSubtitle");

  return (
    <Screen title={t("onboarding.welcome")} scroll activeTab={undefined}>
      <View style={styles.hero}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text>
      </View>

      {step < 2 ? (
        <View style={styles.options}>
          {SUPPORTED_LANGUAGES.map((language) => {
            const selected = step === 0 ? sourceLanguage === language : targetLanguage === language;
            return (
              <Choice
                key={language}
                label={`${flags[language]} ${languageName(language)}`}
                selected={selected}
                onPress={() => {
                  if (step === 0) {
                    setSourceLanguage(language);
                    setLanguage(language);
                  } else {
                    setTargetLanguage(language);
                  }
                }}
              />
            );
          })}
        </View>
      ) : (
        <View style={styles.options}>
          {availableLevels.map((level) => (
            <Choice key={level} label={level} selected={activeLevel === level} onPress={() => setActiveLevel(level)} />
          ))}
        </View>
      )}

      <View style={styles.actions}>
        {step > 0 ? <AppButton title={t("common.back")} variant="secondary" onPress={() => setStep((current) => current - 1)} /> : null}
        <AppButton title={step === 2 ? t("onboarding.startLearning") : t("common.next")} onPress={() => (step === 2 ? finish() : setStep((current) => current + 1))} />
      </View>
    </Screen>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.choice,
        {
          backgroundColor: selected ? "#eef1f6" : theme.surface,
          borderColor: selected ? "transparent" : theme.border
        }
      ]}
    >
      <Text style={[styles.choiceText, { color: selected ? theme.primaryText : theme.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 10,
    marginTop: 10
  },
  choice: {
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 56,
    justifyContent: "center",
    paddingHorizontal: 16
  },
  choiceText: {
    fontSize: 18,
    fontWeight: "900"
  },
  hero: {
    gap: 8,
    marginTop: 26
  },
  options: {
    gap: 10
  },
  subtitle: {
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 23
  },
  title: {
    fontSize: 38,
    fontWeight: "900",
    lineHeight: 44
  }
});
