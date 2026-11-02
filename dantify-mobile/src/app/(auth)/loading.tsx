// src/app/(auth)/loading.tsx
import React from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  Text,
  View,
} from "react-native";

import { useStyles } from "@/styles/styles";
import { useAppColors } from "@/hooks/use-app-colors";

/* ======================================================
   LOADING SCREEN
====================================================== */

export default function LoadingScreen() {
  const styles = useStyles();
  const COLORS = useAppColors();

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
      }}
    >
      <View
        style={[
          styles.container,
          {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
          },
        ]}
      >
        {/* ---------- BRAND ---------- */}

        <Image
          source={require("@/assets/images/dantify-logo.png")}
          style={{
            width: 100,
            height: 100,
            marginBottom: 24,
          }}
          resizeMode="contain"
          accessibilityLabel="Dantify logo"
        />

        {/* ---------- LOADER ---------- */}

        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          accessibilityLabel="Loading"
        />

        {/* ---------- TITLE ---------- */}

        <Text
          style={[
            styles.title,
            {
              marginTop: 20,
              marginBottom: 8,
              color: COLORS.text,
              textAlign: "center",
            },
          ]}
          accessibilityRole="header"
        >
          Loading…
        </Text>

        {/* ---------- DESCRIPTION ---------- */}

        <Text
          style={[
            styles.mutedText,
            {
              textAlign: "center",
              lineHeight: 20,
            },
          ]}
          accessibilityLiveRegion="polite"
        >
          Please wait while we prepare your experience.
        </Text>
      </View>
    </SafeAreaView>
  );
}