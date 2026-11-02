import React from "react";
import { TextInput, TextInputProps } from "react-native";
import { useStyles } from "@/styles/styles";
import { useAppColors } from "@/hooks/use-app-colors";

export function AppInput(props: TextInputProps) {
  const styles = useStyles();
  const COLORS = useAppColors();

  return (
    <TextInput
      {...props}
      style={[styles.textInput, props.style]}
      placeholderTextColor={COLORS.textMuted}
    />
  );
}
