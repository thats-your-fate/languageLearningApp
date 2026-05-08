import { registerRootComponent } from "expo";
import App from "./App";

try {
  const TrackPlayer = require("react-native-track-player").default;
  TrackPlayer.registerPlaybackService(() => require("./src/services/trackPlayerService").default);
} catch {
  // Track Player is only available in native builds, not Expo Go.
}

registerRootComponent(App);
