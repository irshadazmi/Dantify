
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppColors } from '@/hooks/use-app-colors';
import { useStyles } from "@/styles/styles";

export default function Index() {
  const styles = useStyles();
  const COLORS = useAppColors();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: COLORS.background },
      ]}
    >
      <Text style={[styles.title, { color: COLORS.text }]}>
        Dantify Insights
      </Text>
      <Text style={[styles.subtitle, { color: COLORS.textMuted }]}>
        Welcome to your dental practice management system.
      </Text>
    </View>
  );
}
