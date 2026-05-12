import * as Speech from "expo-speech";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { LanguageCode } from "../types/vocabulary";
import { getAiApiUrl } from "./aiPracticeService";

const locales: Record<LanguageCode, string> = {
  en: "en-US",
  de: "de-DE",
  "pt-BR": "pt-BR",
  it: "it-IT",
  es: "es-ES",
  fr: "fr-FR"
};

let activeSound: Audio.Sound | null = null;

async function ensurePlaybackAudioMode(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      playThroughEarpieceAndroid: false,
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
    await stop();
    await playOpenAiTts(text, languageCode, false);
  } catch {
    speakWithDeviceTts(text, languageCode);
  }
}

export async function speakUntilDone(text: string, languageCode: LanguageCode): Promise<void> {
  try {
    await ensurePlaybackAudioMode();
    await stop();
    await playOpenAiTts(text, languageCode, true);
  } catch {
    await speakWithDeviceTtsUntilDone(text, languageCode);
  }
}

export async function stop(): Promise<void> {
  try {
    Speech.stop();
    if (activeSound) {
      const sound = activeSound;
      activeSound = null;
      await sound.stopAsync().catch(() => undefined);
      await sound.unloadAsync().catch(() => undefined);
    }
  } catch {
    console.log("[tts placeholder] stop");
  }
}

async function playOpenAiTts(text: string, languageCode: LanguageCode, waitUntilDone: boolean): Promise<void> {
  const url = getAiApiUrl(`/api/ai-practice/tts?${new URLSearchParams({ text, language: languageCode }).toString()}`);
  if (!url) {
    throw new Error("TTS backend URL is not configured.");
  }

  const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
  activeSound = sound;

  if (!waitUntilDone) {
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        if (activeSound === sound) {
          activeSound = null;
        }
        sound.unloadAsync();
      }
    });
    return;
  }

  await new Promise<void>((resolve) => {
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded || !status.didJustFinish) {
        return;
      }
      if (activeSound === sound) {
        activeSound = null;
      }
      sound.unloadAsync().finally(resolve);
    });
  });
}

function speakWithDeviceTts(text: string, languageCode: LanguageCode): void {
  try {
    Speech.stop();
    Speech.speak(text, { language: locales[languageCode], rate: 0.92 });
  } catch {
    console.log(`[tts placeholder] ${languageCode}: ${text}`);
  }
}

async function speakWithDeviceTtsUntilDone(text: string, languageCode: LanguageCode): Promise<void> {
  try {
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
