import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AiSpeakingPracticeScreen } from "../screens/AiSpeakingPracticeScreen";
import { AiWritingPracticeScreen } from "../screens/AiWritingPracticeScreen";
import { CardDetailScreen } from "../screens/CardDetailScreen";
import { DiscoveryPracticeScreen } from "../screens/DiscoveryPracticeScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { LearnScreen } from "../screens/LearnScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { PracticeHubScreen } from "../screens/PracticeHubScreen";
import { PracticeModeName, PracticeScreen } from "../screens/PracticeScreen";
import { SentencePracticeScreen } from "../screens/SentencePracticeScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { StatsScreen } from "../screens/StatsScreen";
import { WordListScreen } from "../screens/WordListScreen";
import { I18nProvider } from "../i18n";
import { ThemeProvider, useThemeMode } from "../theme";
import { useEffect, useState } from "react";
import { getSettings } from "../services/settingsService";
import { DifficultyGrade } from "../types/progress";
import { AppSettings } from "../types/vocabulary";

export type RootStackParamList = {
  Home: undefined;
  Onboarding: { settings?: AppSettings } | undefined;
  Learn: undefined;
  WordList: { category?: string; groupedCategories?: string[] };
  CardDetail: { cardId: string };
  PracticeHub: undefined;
  DiscoveryPractice: undefined;
  Practice: {
    mode?: PracticeModeName;
    category?: string;
    groupedCategories?: string[];
    practiceSet?: "known" | "weak";
    grade?: DifficultyGrade;
  };
  SentencePractice: { category?: string; groupedCategories?: string[] } | undefined;
  AiWritingPractice: { cardId?: string };
  AiSpeakingPractice: { cardId?: string };
  Stats: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ThemedNavigator />
      </I18nProvider>
    </ThemeProvider>
  );
}

function ThemedNavigator() {
  const { resolvedMode, theme } = useThemeMode();
  const [initialRoute, setInitialRoute] = useState<"Onboarding" | "Learn" | null>(null);

  useEffect(() => {
    getSettings().then((settings) => {
      setInitialRoute(settings.hasCompletedOnboarding ? "Learn" : "Onboarding");
    });
  }, []);

  if (!initialRoute) {
    return null;
  }

  return (
    <NavigationContainer theme={resolvedMode === "dark" ? DarkTheme : DefaultTheme}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          contentStyle: { backgroundColor: theme.background },
          headerShown: false
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Lighthouse" }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ title: "Welcome" }} />
        <Stack.Screen name="Learn" component={LearnScreen} options={{ title: "Learn" }} />
        <Stack.Screen name="WordList" component={WordListScreen} options={{ title: "Word List" }} />
        <Stack.Screen name="CardDetail" component={CardDetailScreen} options={{ title: "Card" }} />
        <Stack.Screen name="PracticeHub" component={PracticeHubScreen} options={{ title: "Practice" }} />
        <Stack.Screen name="DiscoveryPractice" component={DiscoveryPracticeScreen} options={{ title: "Discovery" }} />
        <Stack.Screen name="Practice" component={PracticeScreen} options={{ title: "Flashcards" }} />
        <Stack.Screen name="SentencePractice" component={SentencePracticeScreen} options={{ title: "Sentence Practice" }} />
        <Stack.Screen name="AiWritingPractice" component={AiWritingPracticeScreen} options={{ title: "AI Writing" }} />
        <Stack.Screen name="AiSpeakingPractice" component={AiSpeakingPracticeScreen} options={{ title: "AI Speaking" }} />
        <Stack.Screen name="Stats" component={StatsScreen} options={{ title: "Progress" }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
