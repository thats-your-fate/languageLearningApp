import { ReactNode } from "react";
import { ScrollView, StyleSheet, useColorScheme, View, ViewStyle } from "react-native";
import { useAppTheme } from "../theme";
import { AppHeader } from "./AppHeader";
import { BottomNav, BottomTabName } from "./BottomNav";

type Props = {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  title?: string;
  backLabel?: string;
  activeTab?: BottomTabName;
  headerRight?: React.ReactNode;
};

export function Screen({ children, scroll = true, style, title, backLabel, activeTab, headerRight }: Props) {
  const theme = useAppTheme();

  if (scroll) {
    return (
      <View style={[styles.safe, { backgroundColor: theme.background }]}>
        {title ? <AppHeader title={title} backLabel={backLabel} right={headerRight} /> : null}
        <ScrollView contentContainerStyle={[styles.content, style]} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
        {activeTab ? <BottomNav active={activeTab} /> : null}
      </View>
    );
  }

  return (
    <View style={[styles.safe, { backgroundColor: theme.background }]}>
      {title ? <AppHeader title={title} backLabel={backLabel} right={headerRight} /> : null}
      <View style={[styles.flex, style]}>{children}</View>
      {activeTab ? <BottomNav active={activeTab} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 10,
    padding: 16,
    paddingBottom: 98
  },
  flex: {
    flex: 1
  },
  safe: {
    flex: 1
  }
});
