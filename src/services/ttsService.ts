import * as Speech from "expo-speech";
import { LanguageCode } from "../types/vocabulary";

const locales: Record<LanguageCode, string> = {
  en: "en-US",
  de: "de-DE",
  "pt-BR": "pt-BR",
  it: "it-IT",
  es: "es-ES",
  fr: "fr-FR"
};

export async function speak(text: string, languageCode: LanguageCode): Promise<void> {
  try {
    Speech.stop();
    Speech.speak(text, { language: locales[languageCode], rate: 0.92 });
  } catch {
    console.log(`[tts placeholder] ${languageCode}: ${text}`);
  }
}

export async function stop(): Promise<void> {
  try {
    Speech.stop();
  } catch {
    console.log("[tts placeholder] stop");
  }
}
