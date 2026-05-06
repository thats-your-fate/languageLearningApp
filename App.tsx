import * as NativeSplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ImageBackground, StyleSheet, View } from "react-native";
import { getSplashDurationMs, getSplashImage } from "./src/config/splashConfig";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { getSettings } from "./src/services/settingsService";
import { LanguageCode } from "./src/types/vocabulary";

const splashStartedAt = Date.now();

NativeSplashScreen.preventAutoHideAsync().catch(() => {
  // Native splash may already be hidden during fast refresh.
});

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [splashLanguage, setSplashLanguage] = useState<LanguageCode | undefined>();

  useEffect(() => {
    let mounted = true;

    async function prepare() {
      const settings = await getSettings();
      if (!mounted) return;

      setSplashLanguage(settings.sourceLanguage);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await NativeSplashScreen.hideAsync().catch(() => undefined);

      const remaining = Math.max(0, getSplashDurationMs() - (Date.now() - splashStartedAt));
      const timer = setTimeout(() => {
        if (mounted) {
          setShowSplash(false);
        }
      }, remaining);

      return () => clearTimeout(timer);
    }

    let cleanup: (() => void) | undefined;
    prepare().then((nextCleanup) => {
      cleanup = nextCleanup;
    });

    return () => {
      mounted = false;
      cleanup?.();
    };
  }, []);

  if (showSplash) {
    return (
      <View style={styles.splashRoot}>
        <ImageBackground source={getSplashImage(splashLanguage)} resizeMode="cover" style={styles.splashImage} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <AppNavigator />
    </>
  );
}

const styles = StyleSheet.create({
  splashImage: {
    flex: 1
  },
  splashRoot: {
    backgroundColor: "#ff8a22",
    flex: 1
  }
});
