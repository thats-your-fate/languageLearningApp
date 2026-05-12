import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { Screen } from "../components/Screen";
import { useI18n } from "../i18n";
import { updateSettings, getSettings } from "../services/settingsService";
import { getAvailableStarterLevels } from "../services/vocabularyService";
import { ThemeMode, useAppTheme, useThemeMode } from "../theme";
import { AppSettings, LanguageCode, STARTER_LEVELS, StarterLevel } from "../types/vocabulary";

const languageOptions: { code: LanguageCode; flag: string }[] = [
  { code: "de", flag: "🇩🇪" },
  { code: "en", flag: "🇬🇧" },
  { code: "es", flag: "🇪🇸" },
  { code: "fr", flag: "🇫🇷" },
  { code: "it", flag: "🇮🇹" },
  { code: "pt-BR", flag: "🇵🇹" }
];

const availableLevels = getAvailableStarterLevels().length ? getAvailableStarterLevels() : STARTER_LEVELS;
const levelOptions: (StarterLevel | "All")[] = [...availableLevels, "All"];

export function SettingsScreen() {
  const theme = useAppTheme();
  const { mode, setMode, toggleMode } = useThemeMode();
  const { setLanguage, t } = useI18n();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [draft, setDraft] = useState<AppSettings | null>(null);

  useFocusEffect(
    useCallback(() => {
      getSettings().then((saved) => {
        setSettings(saved);
        setDraft(saved);
      });
    }, [])
  );

  async function save() {
    if (!draft) return;
    const next = await updateSettings(draft);
    setLanguage(next.sourceLanguage);
    setSettings(next);
    setDraft(next);
    Alert.alert(t("common.saved"), t("settings.savedMessage"));
  }

  async function toggleAppearance() {
    const nextMode: ThemeMode = mode === "system" ? "light" : mode === "light" ? "dark" : "system";
    await toggleMode();
    if (draft) {
      setDraft({ ...draft, themeMode: nextMode });
    }
  }

  async function selectAppearance(nextMode: ThemeMode) {
    await setMode(nextMode);
    if (draft) {
      setDraft({ ...draft, themeMode: nextMode });
    }
  }

  if (!settings || !draft) {
    return (
      <Screen title={t("common.settings")} activeTab="Settings">
        <Text style={{ color: theme.text }}>{t("common.loading")}</Text>
      </Screen>
    );
  }

  return (
    <Screen
      title={t("common.settings")}
      activeTab="Settings"
      headerRight={
        <Pressable
          accessibilityRole="button"
          onPress={toggleAppearance}
          style={[styles.themeButton, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}
        >
          <Ionicons name={mode === "system" ? "phone-portrait-outline" : mode === "dark" ? "sunny-outline" : "moon-outline"} size={22} color={theme.text} />
        </Pressable>
      }
    >
      <Text style={[styles.title, { color: theme.text }]}>{t("settings.title")}</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>{t("settings.subtitle")}</Text>

      <LanguageGroup
        title={t("settings.nativeLanguage")}
        selected={draft.sourceLanguage}
        onSelect={(sourceLanguage) => setDraft({ ...draft, sourceLanguage })}
      />
      <LanguageGroup
        title={t("settings.learningLanguage")}
        selected={draft.targetLanguage}
        onSelect={(targetLanguage) => setDraft({ ...draft, targetLanguage })}
      />
      <LevelGroup
        selected={draft.activeLevel}
        onSelect={(activeLevel) => setDraft({ ...draft, activeLevel })}
      />
      <ThemeGroup selected={mode} onSelect={selectAppearance} />

      <AppButton title={t("common.save")} onPress={save} style={styles.save} />
    </Screen>
  );
}

function ThemeGroup({ selected, onSelect }: { selected: ThemeMode; onSelect: (mode: ThemeMode) => void }) {
  const theme = useAppTheme();
  const { t } = useI18n();
  const selectedColors = getSelectedChipColors(theme);
  return (
    <View style={styles.group}>
      <Text style={[styles.groupTitle, { color: theme.text }]}>{t("settings.appearance")}</Text>
      <View style={[styles.appearanceToggle, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
        {[
          { mode: "system" as const, icon: "phone-portrait-outline" as const, label: t("settings.system") },
          { mode: "light" as const, icon: "sunny-outline" as const, label: t("settings.light") },
          { mode: "dark" as const, icon: "moon-outline" as const, label: t("settings.dark") }
        ].map((option) => {
          const active = selected === option.mode;
          return (
            <Pressable
              accessibilityRole="button"
              key={option.mode}
              onPress={() => onSelect(option.mode)}
              style={[styles.appearancePill, active && { backgroundColor: selectedColors.backgroundColor }]}
            >
              <Ionicons name={option.icon} size={17} color={active ? selectedColors.color : theme.textMuted} />
              <Text style={[styles.appearanceText, { color: active ? selectedColors.color : theme.textMuted }]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function LevelGroup({
  selected,
  onSelect
}: {
  selected: StarterLevel | "All";
  onSelect: (level: StarterLevel | "All") => void;
}) {
  const theme = useAppTheme();
  const { t } = useI18n();
  const selectedColors = getSelectedChipColors(theme);
  return (
    <View style={styles.group}>
      <Text style={[styles.groupTitle, { color: theme.text }]}>{t("settings.learningLevel")}</Text>
      <View style={styles.levelChips}>
        {levelOptions.map((level) => {
          const active = level === selected;
          return (
            <Pressable
              accessibilityRole="button"
              key={level}
              onPress={() => onSelect(level)}
              style={[
                styles.levelChip,
                {
                  backgroundColor: active ? selectedColors.backgroundColor : "transparent",
                  borderColor: active ? "transparent" : theme.border
                }
              ]}
            >
              <Text style={[styles.chipText, { color: active ? selectedColors.color : theme.text }]}>{level}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function LanguageGroup({
  title,
  selected,
  onSelect
}: {
  title: string;
  selected: LanguageCode;
  onSelect: (language: LanguageCode) => void;
}) {
  const theme = useAppTheme();
  const { languageName } = useI18n();
  const selectedColors = getSelectedChipColors(theme);
  return (
    <View style={styles.group}>
      <Text style={[styles.groupTitle, { color: theme.text }]}>{title}</Text>
      <View style={styles.chips}>
        {languageOptions.map((option) => {
          const active = option.code === selected;
          return (
            <Pressable
              accessibilityRole="button"
              key={option.code}
              onPress={() => onSelect(option.code)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? selectedColors.backgroundColor : "transparent",
                  borderColor: active ? "transparent" : theme.border
                },
                option.code === "pt-BR" && styles.wideChip
              ]}
            >
              <Text style={styles.flag}>{option.flag}</Text>
              <Text style={[styles.chipText, { color: active ? selectedColors.color : theme.text }]}>{languageName(option.code)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function getSelectedChipColors(theme: ReturnType<typeof useAppTheme>) {
  return { backgroundColor: theme.activeElement, color: theme.activeElementText };
}

const styles = StyleSheet.create({
  appearancePill: {
    alignItems: "center",
    borderRadius: 12,
    flex: 1,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 40
  },
  appearanceText: {
    fontSize: 14,
    fontWeight: "900"
  },
  appearanceToggle: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    padding: 5
  },
  chip: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 14
  },
  chipText: {
    fontSize: 16,
    fontWeight: "900"
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  flag: {
    fontSize: 17
  },
  group: {
    gap: 14,
    marginTop: 12
  },
  groupTitle: {
    fontSize: 17,
    fontWeight: "900"
  },
  levelChip: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
    minWidth: 72,
    justifyContent: "center",
    paddingHorizontal: 16
  },
  levelChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  save: {
    marginTop: 22
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 25,
    marginTop: -6
  },
  themeButton: {
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
    height: 46,
    justifyContent: "center",
    width: 52
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 40,
    marginTop: 12
  },
  wideChip: {
    minWidth: 210
  }
});
