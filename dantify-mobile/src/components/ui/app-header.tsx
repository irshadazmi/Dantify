
/* src/components/ui/app-header.tsx */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '@/contexts/theme-context';
import { useAuth } from '@/contexts/auth-context';
import { useAppColors } from '@/hooks/use-app-colors';

type Props = {
  title: string;
};

const AppHeader: React.FC<Props> = ({ title }) => {
  const router = useRouter();
  const colors = useAppColors();
  const { mode, resolvedMode, setMode } = useTheme();
  const { logout } = useAuth();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /* ---------- THEME ---------- */

  const handleThemePress = async () => {
    const nextMode =
      mode === 'system'
        ? 'light'
        : mode === 'light'
          ? 'dark'
          : 'system';

    await setMode(nextMode);
  };

  const themeIcon: React.ComponentProps<typeof Ionicons>['name'] =
    mode === 'system'
      ? 'contrast-outline'
      : resolvedMode === 'dark'
        ? 'moon-outline'
        : 'sunny-outline';

  const themeLabel =
    mode === 'system'
      ? 'Theme: System'
      : mode === 'dark'
        ? 'Theme: Dark'
        : 'Theme: Light';

  /* ---------- LOGOUT ---------- */

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('[Header] Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  /* ---------- RENDER ---------- */

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.primary,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <Text
        style={[styles.title, { color: colors.textInverse }]}
        numberOfLines={1}
        accessibilityRole="header"
      >
        {title}
      </Text>

      <View style={styles.actions}>
        <Pressable
          onPress={handleThemePress}
          accessibilityRole="button"
          accessibilityLabel={themeLabel}
          hitSlop={8}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name={themeIcon}
            size={23}
            color={colors.textInverse}
          />
        </Pressable>

        <Pressable
          onPress={handleLogout}
          disabled={isLoggingOut}
          accessibilityRole="button"
          accessibilityLabel="Log out"
          hitSlop={8}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.pressed,
            isLoggingOut && styles.disabled,
          ]}
        >
          {isLoggingOut ? (
            <ActivityIndicator
              size="small"
              color={colors.textInverse}
            />
          ) : (
            <Ionicons
              name="log-out-outline"
              size={23}
              color={colors.textInverse}
            />
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    marginRight: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  pressed: {
    opacity: 0.65,
  },
  disabled: {
    opacity: 0.6,
  },
});

export default AppHeader;
