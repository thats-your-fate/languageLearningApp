import { createContext, createElement, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { getSettings, updateSettings } from "./services/settingsService";
import { AppSettings } from "./types/vocabulary";

export type AppTheme = {
  isDark: boolean;
  background: string;
  header: string;
  nav: string;
  surface: string;
  surfaceMuted: string;
  surfaceStrong: string;
  input: string;
  activeNav: string;
  soundButton: string;
  divider: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryText: string;
  danger: string;
  warning: string;
  info: string;
  success: string;
};

export type ThemeMode = AppSettings["themeMode"];

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedMode: "dark" | "light";
  theme: AppTheme;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleMode: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function getTheme(isDark: boolean): AppTheme {
  if (!isDark) {
    return {
      isDark: false,
      background: "#f4f7fb",
      header: "#fbfbfd",
      nav: "#ffffff",
      surface: "#ffffff",
      surfaceMuted: "#e7edf6",
      surfaceStrong: "#dce5f1",
      input: "#e2e9f3",
      activeNav: "#eee9ff",
      soundButton: "#d2dbe8",
      divider: "#d7e0ed",
      text: "#101827",
      textMuted: "#647083",
      border: "#cfd8e6",
      primary: "#7c5cff",
      primaryText: "#101827",
      danger: "#c92727",
      warning: "#c87200",
      info: "#2854d9",
      success: "#08704f"
    };
  }

  return {
    isDark: true,
    background: "#071120",
    header: "#111111",
    nav: "#17191f",
    surface: "#101827",
    surfaceMuted: "#202b3c",
    surfaceStrong: "#3b4657",
    input: "#3d4858",
    activeNav: "#3a3d48",
    soundButton: "#536074",
    divider: "#2d3748",
    text: "#f4f5f8",
    textMuted: "#9aa3b2",
    border: "#344052",
    primary: "#b7a2ff",
    primaryText: "#0b1220",
    danger: "#ad1d1d",
    warning: "#c65a00",
    info: "#2854d9",
    success: "#35d99a"
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const resolvedMode: "dark" | "light" = mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;

  useEffect(() => {
    getSettings().then((settings) => setModeState(settings.themeMode));
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    async function setMode(nextMode: ThemeMode) {
      setModeState(nextMode);
      await updateSettings({ themeMode: nextMode });
    }

    async function toggleMode() {
      const nextMode: ThemeMode = mode === "system" ? "light" : mode === "light" ? "dark" : "system";
      await setMode(nextMode);
    }

    return {
      mode,
      resolvedMode,
      theme: getTheme(resolvedMode === "dark"),
      setMode,
      toggleMode
    };
  }, [mode, resolvedMode]);

  return createElement(ThemeContext.Provider, { value }, children);
}

export function useAppTheme(): AppTheme {
  return useThemeContext().theme;
}

export function useThemeMode() {
  return useThemeContext();
}

function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      mode: "system",
      resolvedMode: "dark",
      theme: getTheme(true),
      setMode: async () => undefined,
      toggleMode: async () => undefined
    };
  }
  return context;
}
