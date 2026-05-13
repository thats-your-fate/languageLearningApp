import { getAiApiUrl } from "./aiPracticeService";
import { AppSettings, PracticeCardView } from "../types/vocabulary";

export const discoveryPauseMs = 1500;

export type DiscoverySpokenItem = {
  text: string;
  language: AppSettings["targetLanguage"];
};

export async function prefetchDiscoveryCardAudio(card: PracticeCardView, settings: AppSettings): Promise<boolean> {
  const apiUrl = getAiApiUrl("/api/ai-practice/tts/prefetch");
  if (!apiUrl) {
    return false;
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: discoverySpokenItems(card, settings)
      })
    });
    if (!response.ok) {
      return false;
    }

    const result = (await response.json()) as { warmed?: number; total?: number };
    return Boolean(result.total) && result.warmed === result.total;
  } catch {
    // Prefetch is best-effort; playback can still generate/cache on demand.
    return false;
  }
}

export function discoverySpokenItems(card: PracticeCardView, settings: AppSettings): DiscoverySpokenItem[] {
  return [
    { text: card.targetText, language: settings.targetLanguage },
    { text: card.sourceText, language: settings.sourceLanguage },
    { text: card.targetExample, language: settings.targetLanguage },
    { text: card.sourceExample, language: settings.sourceLanguage }
  ];
}
