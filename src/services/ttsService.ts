import * as Speech from "expo-speech";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { LanguageCode } from "../types/vocabulary";

const locales: Record<LanguageCode, string> = {
  en: "en-US",
  de: "de-DE",
  "pt-BR": "pt-BR",
  it: "it-IT",
  es: "es-ES",
  fr: "fr-FR"
};

async function ensurePlaybackAudioMode(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: false,
      staysActiveInBackground: true
    });
  } catch {
    // Background audio setup is best-effort; speech still works in foreground.
  }
}

export async function speak(text: string, languageCode: LanguageCode): Promise<void> {
  try {
    await ensurePlaybackAudioMode();
    Speech.stop();
    Speech.speak(text, { language: locales[languageCode], rate: 0.92 });
  } catch {
    console.log(`[tts placeholder] ${languageCode}: ${text}`);
  }
}

export async function speakUntilDone(text: string, languageCode: LanguageCode): Promise<void> {
  try {
    await ensurePlaybackAudioMode();
    Speech.stop();
    await new Promise<void>((resolve) => {
      Speech.speak(text, {
        language: locales[languageCode],
        rate: 0.92,
        onDone: resolve,
        onStopped: resolve,
        onError: () => resolve()
      });
    });
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
