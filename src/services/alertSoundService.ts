import { Audio } from "expo-av";

const successSound = require("../../assets/sounds/success.wav");
const failSound = require("../../assets/sounds/fail.wav");

export async function playSuccessAlert(): Promise<void> {
  await playAlert(successSound);
}

export async function playFailAlert(): Promise<void> {
  await playAlert(failSound);
}

async function playAlert(source: number): Promise<void> {
  try {
    const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: true, volume: 0.7 });
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch {
    // Audio alerts are a nice-to-have; never block practice if playback fails.
  }
}
