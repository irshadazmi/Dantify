import React from "react";
import { Pressable, ActivityIndicator } from "react-native";
import { AppText } from "./app-text";
import { useStyles } from "@/styles/styles";
import { useAppColors } from "@/hooks/use-app-colors";

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'small' | 'circular' | 'otp';
};

export function AppButton({
  title,
  onPress,
  loading,
  disabled,
  variant = "primary",
}: Props) {
  const styles = useStyles();
  const COLORS = useAppColors();

  const styleMap = {
    primary: styles.button,
    small: styles.smallButton,
    circular: styles.circularButton,
    otp: styles.otpButton,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styleMap[variant],
        (disabled || loading) && styles.disabledButton,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.badgeText} />
      ) : (
        <AppText variant="button">{title}</AppText>
      )}
    </Pressable>
  );
}
