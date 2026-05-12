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
const playbackSettleMs = 300;
const prefetchChunkSize = 8;

export type TtsPrefetchItem = {
  text: string;
  language: LanguageCode;
};

function estimateSpeechTimeoutMs(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const characters = text.trim().length;
  const estimate = Math.max(words * 900, characters * 140) + 5000;
  return Math.min(90000, Math.max(8000, estimate));
}

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

export async function prefetchTtsAudio(items: TtsPrefetchItem[]): Promise<void> {
  const apiUrl = getAiApiUrl("/api/ai-practice/tts/prefetch");
  if (!apiUrl) return;

  const uniqueItems = dedupePrefetchItems(items);
  for (let index = 0; index < uniqueItems.length; index += prefetchChunkSize) {
    const chunk = uniqueItems.slice(index, index + prefetchChunkSize);
    try {
      await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: chunk })
      });
    } catch {
      return;
    }
  }
}

async function playOpenAiTts(text: string, languageCode: LanguageCode, waitUntilDone: boolean): Promise<void> {
  const url = getAiApiUrl(`/api/ai-practice/tts?${new URLSearchParams({ text, language: languageCode }).toString()}`);
  if (!url) {
    throw new Error("TTS backend URL is not configured.");
  }

  const { sound } = await Audio.Sound.createAsync(
    { uri: url },
    { progressUpdateIntervalMillis: 250, shouldPlay: true }
  );
  activeSound = sound;

  if (!waitUntilDone) {
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        if (activeSound === sound) {
          activeSound = null;
        }
        setTimeout(() => {
          sound.unloadAsync();
        }, playbackSettleMs);
      }
    });
    return;
  }

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (activeSound === sound) {
        activeSound = null;
      }
      setTimeout(() => {
        sound.unloadAsync().finally(resolve);
      }, playbackSettleMs);
    };
    const fail = (message?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (activeSound === sound) {
        activeSound = null;
      }
      sound.unloadAsync().finally(() => reject(new Error(message || "TTS playback failed.")));
    };
    const timeout = setTimeout(finish, estimateSpeechTimeoutMs(text));

    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) {
        if (status.error) {
          fail(status.error);
        }
        return;
      }
      if (status.didJustFinish) {
        finish();
      }
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

function dedupePrefetchItems(items: TtsPrefetchItem[]): TtsPrefetchItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const text = item.text.trim();
    if (!text) return false;
    const key = `${item.language}:${text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
