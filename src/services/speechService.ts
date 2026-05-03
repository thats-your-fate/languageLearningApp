import { LanguageCode } from "../types/vocabulary";

export async function isAvailable(): Promise<boolean> {
  return false;
}

export async function startListening(_languageCode: LanguageCode): Promise<void> {
  throw new Error("Speech recognition is not implemented in this Expo starter. Use the typed transcript fallback.");
}

export async function stopListening(): Promise<string> {
  throw new Error("Speech recognition is not implemented in this Expo starter. Use the typed transcript fallback.");
}
