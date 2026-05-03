import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppSettings } from "../types/vocabulary";

const SETTINGS_KEY = "lighthouse:settings";

export const defaultSettings: AppSettings = {
  sourceLanguage: "en",
  targetLanguage: "pt-BR",
  activeLevel: "A1",
  themeMode: "dark",
  aiFeedbackLanguage: "mixed",
  autoPlayAudio: false,
  enableAiExplanations: true,
  hasCompletedOnboarding: false
};

let memorySettings: AppSettings = defaultSettings;

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaultSettings, ...(JSON.parse(raw) as Partial<AppSettings>) } : defaultSettings;
  } catch {
    return memorySettings;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  memorySettings = settings;
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    memorySettings = settings;
  }
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const next = { ...(await getSettings()), ...patch };
  await saveSettings(next);
  return next;
}
