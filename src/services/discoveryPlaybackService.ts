import type { EmitterSubscription } from "react-native";
import type { Track } from "react-native-track-player";
import { getAiApiUrl } from "./aiPracticeService";
import { setupTrackPlayer } from "./trackPlayerSetup";
import { AppSettings, LanguageCode, PracticeCardView } from "../types/vocabulary";

type PlaybackListener = (isPlaying: boolean) => void;

const silenceMs = 1500;
export const discoveryFinalSilenceMs = silenceMs;
const artwork = require("../../assets/icon.png");

export async function playDiscoveryCard(card: PracticeCardView, settings: AppSettings): Promise<boolean> {
  const tracks = buildDiscoveryTracks(card, settings);
  if (!tracks) {
    return false;
  }

  try {
    const warmed = await prefetchDiscoveryCardAudio(card, settings);
    if (!warmed) {
      return false;
    }

    const { default: TrackPlayer } = await import("react-native-track-player");
    await setupTrackPlayer();
    await TrackPlayer.reset();
    await TrackPlayer.add(tracks);
    await TrackPlayer.play();
    return true;
  } catch {
    return false;
  }
}

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
        items: discoverySpokenItems(card, settings).map((item) => ({
          text: item.text,
          language: item.language
        }))
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

export async function stopDiscoveryPlayback(): Promise<void> {
  try {
    const { default: TrackPlayer } = await import("react-native-track-player");
    await TrackPlayer.stop();
    await TrackPlayer.reset();
  } catch {
    // Track Player is unavailable in Expo Go; the caller can still stop expo-speech.
  }
}

export async function subscribeDiscoveryQueueEnded(onEnded: () => void): Promise<EmitterSubscription | null> {
  try {
    const { default: TrackPlayer, Event } = await import("react-native-track-player");
    return TrackPlayer.addEventListener(Event.PlaybackQueueEnded, onEnded);
  } catch {
    return null;
  }
}

export async function subscribeDiscoveryPlaybackState(listener: PlaybackListener): Promise<EmitterSubscription | null> {
  try {
    const { default: TrackPlayer, Event, State } = await import("react-native-track-player");
    return TrackPlayer.addEventListener(Event.PlaybackState, ({ state }) => {
      listener(state === State.Playing || state === State.Buffering || state === State.Loading || state === State.Ready);
    });
  } catch {
    return null;
  }
}

export async function subscribeDiscoveryPlaybackEnded(onEnded: () => void): Promise<EmitterSubscription | null> {
  try {
    const { default: TrackPlayer, Event, State } = await import("react-native-track-player");
    return TrackPlayer.addEventListener(Event.PlaybackState, ({ state }) => {
      if (state === State.Ended) {
        onEnded();
      }
    });
  } catch {
    return null;
  }
}

export async function subscribeDiscoveryFinalSilence(onFinalSilence: () => void): Promise<EmitterSubscription | null> {
  try {
    const { default: TrackPlayer, Event } = await import("react-native-track-player");
    return TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, ({ track }) => {
      if (track?.id?.endsWith("-source-example-pause")) {
        onFinalSilence();
      }
    });
  } catch {
    return null;
  }
}

export async function subscribeDiscoveryPlaybackError(onError: () => void): Promise<EmitterSubscription | null> {
  try {
    const { default: TrackPlayer, Event } = await import("react-native-track-player");
    return TrackPlayer.addEventListener(Event.PlaybackError, onError);
  } catch {
    return null;
  }
}

function buildDiscoveryTracks(card: PracticeCardView, settings: AppSettings): Track[] | null {
  const spoken = discoverySpokenItems(card, settings);

  const tracks: Track[] = [];
  spoken.forEach((item, index) => {
    const url = ttsUrl(item.text, item.language);
    const silenceUrl = getAiApiUrl(`/api/ai-practice/silence.wav?ms=${silenceMs}`);
    if (!url || !silenceUrl) {
      return;
    }

    tracks.push({
      id: item.id,
      url,
      title: item.trackTitle,
      artist: "Lighthouse",
      album: item.subtitle,
      artwork,
      contentType: "audio/mpeg"
    });
    tracks.push({
      id: `${item.id}-pause`,
      url: silenceUrl,
      title: index === spoken.length - 1 ? `${card.targetText} · complete` : `${item.title} · pause`,
      artist: "Lighthouse",
      album: "Pause",
      artwork,
      contentType: "audio/wav"
    });
  });

  return tracks.length === spoken.length * 2 ? tracks : null;
}

function discoverySpokenItems(card: PracticeCardView, settings: AppSettings) {
  return [
    {
      id: `${card.id}-target-word`,
      title: card.targetText,
      trackTitle: `${card.targetText} · word`,
      subtitle: card.partOfSpeech,
      text: card.targetText,
      language: settings.targetLanguage
    },
    {
      id: `${card.id}-source-word`,
      title: card.sourceText,
      trackTitle: `${card.sourceText} · translation`,
      subtitle: "Translation",
      text: card.sourceText,
      language: settings.sourceLanguage
    },
    {
      id: `${card.id}-target-example`,
      title: card.targetText,
      trackTitle: `${card.targetText} · example`,
      subtitle: "Example sentence",
      text: card.targetExample,
      language: settings.targetLanguage
    },
    {
      id: `${card.id}-source-example`,
      title: card.sourceText,
      trackTitle: `${card.sourceText} · native example`,
      subtitle: "Native translation",
      text: card.sourceExample,
      language: settings.sourceLanguage
    }
  ];
}

function ttsUrl(text: string, language: LanguageCode): string | null {
  return getAiApiUrl(`/api/ai-practice/tts?${new URLSearchParams({ text, language }).toString()}`);
}
