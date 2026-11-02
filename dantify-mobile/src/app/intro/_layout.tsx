// src/app/intro/_layout.tsx
import { Stack } from "expo-router";

export default function IntroLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="first_screen" />
      <Stack.Screen name="second_screen" />
      <Stack.Screen name="third_screen" />
      <Stack.Screen name="fourth_screen" />
    </Stack>
  );
}
