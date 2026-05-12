import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { useAppTheme } from "../theme";

type Props = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  style?: ViewStyle;
};

export function AppButton({ title, onPress, variant = "primary", disabled, style }: Props) {
  const theme = useAppTheme();
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isPrimary ? theme.activeElement : isDanger ? theme.danger : variant === "secondary" ? theme.surfaceMuted : "transparent",
          borderColor: isPrimary || isDanger ? "transparent" : theme.border
        },
        variant !== "ghost" && styles.outlined,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: isPrimary ? theme.activeElementText : isDanger ? theme.text : theme.text
          }
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 10,
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  disabled: {
    opacity: 0.45
  },
  outlined: {
    borderWidth: 1
  },
  pressed: {
    opacity: 0.78
  },
  text: {
    fontSize: 14,
    fontWeight: "800"
  }
});
