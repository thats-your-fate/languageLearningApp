let setupPromise: Promise<void> | null = null;

export async function setupTrackPlayer(): Promise<void> {
  if (!setupPromise) {
    setupPromise = setupTrackPlayerOnce();
  }

  return setupPromise;
}

async function setupTrackPlayerOnce(): Promise<void> {
  const { default: TrackPlayer, AppKilledPlaybackBehavior, Capability } = await import("react-native-track-player");
  await requestNotificationPermission();

  try {
    await TrackPlayer.setupPlayer();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("already been initialized")) {
      throw error;
    }
  }

  await TrackPlayer.updateOptions({
    android: {
      appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback
    },
    capabilities: [Capability.Play, Capability.Pause, Capability.Stop],
    compactCapabilities: [Capability.Play, Capability.Pause, Capability.Stop],
    notificationCapabilities: [Capability.Play, Capability.Pause, Capability.Stop],
    progressUpdateEventInterval: 1
  });
}

async function requestNotificationPermission(): Promise<void> {
  const { PermissionsAndroid, Platform } = await import("react-native");
  if (Platform.OS !== "android" || Platform.Version < 33) {
    return;
  }

  const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  if (!granted) {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }
}
