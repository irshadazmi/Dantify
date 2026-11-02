import React from "react";
import { Text, TextProps } from "react-native";
import { useAppColors } from "@/hooks/use-app-colors";

type Variant =
  | "title"
  | "subtitle"
  | "label"
  | "body"
  | "muted"
  | "error"
  | "button"
  | "link"
  | "legend";


type Props = TextProps & {
  variant?: Variant;
};

export function AppText({
  variant = "body",
  style,
  children,
  ...props
}: Props) {
  const COLORS = useAppColors();

  const base = {
    color: COLORS.text,
  };

  const variants: Record<Variant, any> = {
    title: {
      fontSize: 22,
      fontWeight: "700",
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: COLORS.textSecondary,
      marginBottom: 12,
    },
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: COLORS.text,
    },
    body: {
      fontSize: 14,
    },
    muted: {
      fontSize: 13,
      color: COLORS.textMuted,
    },
    error: {
      fontSize: 12,
      color: COLORS.danger,
      marginTop: 4,
    },
    button: {
      fontSize: 16,
      fontWeight: "600",
      color: COLORS.badgeText,
      letterSpacing: 0.4,
    },
    link: {
      color: COLORS.primary,
      fontWeight: "600",
    },
    legend: {
      fontSize: 12,
      color: COLORS.textSecondary,
    },
  };

  return (
    <Text
      {...props}
      style={[base, variants[variant], style]}
    >
      {children}
    </Text>
  );
}
