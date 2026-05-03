import { useState } from "react";
import { StyleSheet, TextInput, useColorScheme, View } from "react-native";
import { useAppTheme } from "../theme";
import { AppButton } from "./AppButton";

type Props = {
  placeholder?: string;
  submitLabel?: string;
  multiline?: boolean;
  onSubmit: (value: string) => void;
};

export function AnswerInput({ placeholder = "Type your answer", submitLabel = "Submit", multiline, onSubmit }: Props) {
  const theme = useAppTheme();
  const [value, setValue] = useState("");

  function submit() {
    onSubmit(value);
  }

  return (
    <View style={styles.container}>
      <TextInput
        multiline={multiline}
        onChangeText={setValue}
        onSubmitEditing={multiline ? undefined : submit}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        returnKeyType="done"
        style={[
          styles.input,
          multiline && styles.multiline,
          { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }
        ]}
        value={value}
      />
      <AppButton title={submitLabel} onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 17,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: "top"
  }
});
