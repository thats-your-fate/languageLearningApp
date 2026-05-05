import { Audio } from "expo-av";
import { LanguageCode } from "../types/vocabulary";
import { getAiApiUrl } from "./aiPracticeService";

let recording: Audio.Recording | null = null;
let activeLanguage: LanguageCode = "en";

export async function isAvailable(): Promise<boolean> {
  return Boolean(getAiApiUrl("/api/ai-practice/transcribe"));
}

export async function startListening(languageCode: LanguageCode): Promise<void> {
  if (recording) {
    await stopLocalRecording();
  }

  const apiUrl = getAiApiUrl("/api/ai-practice/transcribe");
  if (!apiUrl) {
    throw new Error("Speech transcription backend is not configured. Use the typed transcript fallback.");
  }

  const permission = await Audio.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Microphone permission is required for speaking practice.");
  }

  activeLanguage = languageCode;
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true
  });

  const created = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
  recording = created.recording;
}

export async function stopListening(): Promise<string> {
  const uri = await stopLocalRecording();
  if (!uri) {
    throw new Error("No recording was captured. Use the typed transcript fallback.");
  }

  const apiUrl = getAiApiUrl("/api/ai-practice/transcribe");
  if (!apiUrl) {
    throw new Error("Speech transcription backend is not configured. Use the typed transcript fallback.");
  }

  const body = new FormData();
  body.append("language", activeLanguage);
  body.append("audio", {
    uri,
    name: "speech.m4a",
    type: "audio/m4a"
  } as unknown as Blob);

  let response: Response;
  try {
    response = await fetch(apiUrl, {
      method: "POST",
      body
    });
  } catch {
    throw new Error(`Cannot reach speech backend at ${apiUrl}. Check Wi-Fi, server, and rebuild/restart Expo after changing EXPO_PUBLIC_AI_API_URL.`);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Speech transcription failed: ${response.status}${errorText ? ` ${errorText}` : ""}`);
  }

  const result = (await response.json()) as { transcript?: string };
  return result.transcript?.trim() ?? "";
}

async function stopLocalRecording() {
  if (!recording) return null;

  const current = recording;
  recording = null;
  await current.stopAndUnloadAsync();
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
  return current.getURI();
}
