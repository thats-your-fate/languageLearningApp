import { Ionicons } from "@expo/vector-icons";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";
import { useI18n } from "../i18n";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useAppTheme } from "../theme";

export type BottomTabName = "Learn" | "Practice" | "Stats" | "Settings";

type Props = {
  active: BottomTabName;
};

const tabs: { name: BottomTabName; icon: keyof typeof Ionicons.glyphMap; route: keyof RootStackParamList }[] = [
  { name: "Learn", icon: "home-outline", route: "Learn" },
  { name: "Practice", icon: "flash-outline", route: "PracticeHub" },
  { name: "Stats", icon: "bar-chart-outline", route: "Stats" },
  { name: "Settings", icon: "settings-outline", route: "Settings" }
];

export function BottomNav({ active }: Props) {
  const theme = useAppTheme();
  const { t } = useI18n();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <View style={[styles.nav, { backgroundColor: theme.nav, borderColor: theme.border }]}>
        {tabs.map((tab) => {
          const isActive = active === tab.name;
          return (
            <Pressable
              accessibilityRole="button"
              key={tab.name}
              onPress={() => {
                if (tab.route === "Practice") {
                  navigation.navigate("Practice", {});
                } else {
                  navigation.navigate(tab.route as never);
                }
              }}
              style={[styles.item, isActive && { backgroundColor: theme.activeNav }]}
            >
              <Ionicons name={tab.icon} size={25} color={isActive ? theme.primary : theme.text} />
              <Text style={[styles.label, { color: isActive ? theme.primary : theme.text }]}>{t(tabLabelKey(tab.name))}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function tabLabelKey(tab: BottomTabName) {
  if (tab === "Practice") return "common.practice";
  if (tab === "Stats") return "common.stats";
  if (tab === "Settings") return "common.settings";
  return "common.learn";
}

const styles = StyleSheet.create({
  item: {
    alignItems: "center",
    borderRadius: 26,
    flex: 1,
    gap: 1,
    justifyContent: "center",
    minHeight: 54
  },
  label: {
    fontSize: 12,
    fontWeight: "800"
  },
  nav: {
    borderRadius: 34,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    minHeight: 66,
    padding: 7
  },
  wrap: {
    bottom: 14,
    left: 18,
    position: "absolute",
    right: 18
  }
});
