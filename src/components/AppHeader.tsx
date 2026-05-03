import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";
import { useAppTheme } from "../theme";

type Props = {
  title: string;
  backLabel?: string;
  right?: React.ReactNode;
};

export function AppHeader({ title, backLabel, right }: Props) {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const canGoBack = navigation.canGoBack();

  return (
    <View style={[styles.header, { backgroundColor: theme.header, borderBottomColor: theme.border }]}>
      <View style={styles.side}>
        {canGoBack ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { borderColor: theme.border }]}
          >
            <Ionicons name="chevron-back" size={28} color={theme.text} />
            {backLabel ? <Text style={[styles.backLabel, { color: theme.text }]}>{backLabel}</Text> : null}
          </Pressable>
        ) : null}
      </View>
      <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
        {title}
      </Text>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    borderRadius: 32,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 46,
    paddingLeft: 8,
    paddingRight: 14
  },
  backLabel: {
    fontSize: 17,
    fontWeight: "800",
    marginLeft: 2
  },
  header: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 98,
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 44
  },
  right: {
    alignItems: "flex-end"
  },
  side: {
    minWidth: 88
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center"
  }
});
