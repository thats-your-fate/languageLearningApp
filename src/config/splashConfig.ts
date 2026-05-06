import { ImageSourcePropType } from "react-native";
import { LanguageCode } from "../types/vocabulary";

const splashImages: Record<string, ImageSourcePropType> = {
  "splash-default": require("../../assets/splash/splash-default.png"),
  "splash-en": require("../../assets/splash/splash-en.png"),
  "splash-de": require("../../assets/splash/splash-de.png"),
  "splash-pt-BR": require("../../assets/splash/splash-pt-BR.png"),
  "splash-it": require("../../assets/splash/splash-it.png"),
  "splash-es": require("../../assets/splash/splash-es.png"),
  "splash-fr": require("../../assets/splash/splash-fr.png")
};

const splashKeys: Record<LanguageCode | "default", string | undefined> = {
  default: process.env.EXPO_PUBLIC_SPLASH_IMAGE_DEFAULT ?? "splash-default",
  en: process.env.EXPO_PUBLIC_SPLASH_IMAGE_EN ?? "splash-en",
  de: process.env.EXPO_PUBLIC_SPLASH_IMAGE_DE ?? "splash-de",
  "pt-BR": process.env.EXPO_PUBLIC_SPLASH_IMAGE_PT_BR ?? "splash-pt-BR",
  it: process.env.EXPO_PUBLIC_SPLASH_IMAGE_IT ?? "splash-it",
  es: process.env.EXPO_PUBLIC_SPLASH_IMAGE_ES ?? "splash-es",
  fr: process.env.EXPO_PUBLIC_SPLASH_IMAGE_FR ?? "splash-fr"
};

export function getSplashDurationMs(): number {
  const parsed = Number(process.env.EXPO_PUBLIC_SPLASH_MIN_DURATION_MS);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 1000;
}

export function getSplashImage(languageCode?: LanguageCode): ImageSourcePropType {
  const key = splashKeys[languageCode ?? "default"] ?? splashKeys.default ?? "splash-default";
  return splashImages[key] ?? splashImages["splash-default"];
}
