// src/components/ui/app-chip-group.tsx
import React from "react";
import { View, Pressable, Text } from "react-native";
import { useStyles } from "@/styles/styles";

/* ======================================================
   TYPES
====================================================== */

export type ChipOption<T extends string = string> = {
  label: string;
  value: T;
};

type Props<T extends string> = {
  options: readonly ChipOption<T>[];   // ✅ readonly-safe
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "outline";
};

/* ======================================================
   COMPONENT
====================================================== */

export function AppChipGroup<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  const styles = useStyles();

  return (
    <View style={styles.chipsContainer}>
      {options.map((opt) => {
        const selected = opt.value === value;

        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.chip,
              selected && styles.chipSelected,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                selected && styles.chipTextSelected,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
