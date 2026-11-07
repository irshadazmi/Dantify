// src/app/splash.tsx

import { useEffect } from "react";
import { Image, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

import { useStyles } from "@/styles/styles";
import { useAppColors } from "@/hooks/use-app-colors";
import { useAuth } from "@/contexts/auth-context";

export default function SplashScreen() {
  const styles = useStyles();
  const colors = useAppColors();
  const router = useRouter();

  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    // Wait until AuthProvider has restored and validated
    // the stored authentication session.
    if (isLoading) {
      return;
    }

    let cancelled = false;

    const navigate = async () => {
      try {
        // Preserve the existing intro-screen behavior.
        const flag = await AsyncStorage.getItem("hasSeenIntro");


        if (cancelled) {
          return;
        }

        // Keep a short splash display.
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 2000);
        });

        if (cancelled) {
          return;
        }

        if (flag !== "true") {
          router.replace("/intro/first_screen");
          return;
        }

        if (isAuthenticated) {
          // Replace this route if your dashboard uses
          // a different Expo Router path.
          router.replace("/dashboard");
        } else {
          router.replace("/(auth)/login");
        }
      } catch (error) {
        console.warn("[Splash] Navigation check failed.", error);

        if (!cancelled) {
          router.replace("/(auth)/login");
        }
      }
    };

    void navigate();

    return () => {
      cancelled = true;
    };
  }, [isLoading, isAuthenticated, router]);

  return (
    <View
      style={[
        styles.container,
        {
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
          alignItems: "center",
        },
      ]}
    >
      <Image
        source={require("@/assets/images/splash.png")}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="Dantify splash screen"
      />
    </View>
  );
}