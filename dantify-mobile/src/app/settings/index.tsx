// src/app/settings/index.tsx

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useStyles } from '@/styles/styles';
import { useAppColors } from '@/hooks/use-app-colors';
import { useTheme } from '@/contexts/theme-context';
import { settingsService } from '@/services/settings-service';

/* ======================================================
   TYPES
====================================================== */

export type DantifySettings = {
  theme: 'System' | 'Light' | 'Dark';
  notifications: boolean;
  appointmentReminders: boolean;
};

const DEFAULT_SETTINGS: DantifySettings = {
  theme: 'System',
  notifications: true,
  appointmentReminders: true,
};

const THEMES: DantifySettings['theme'][] = [
  'System',
  'Light',
  'Dark',
];

const mapTheme = (
  theme: DantifySettings['theme'],
): 'system' | 'light' | 'dark' => {
  switch (theme) {
    case 'Light':
      return 'light';
    case 'Dark':
      return 'dark';
    default:
      return 'system';
  }
};

/* ======================================================
   COMPONENT
====================================================== */

export default function Settings() {
  const styles = useStyles();
  const COLORS = useAppColors();
  const router = useRouter();
  const { setMode } = useTheme();

  const [settings, setSettings] =
    useState<DantifySettings>(DEFAULT_SETTINGS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ======================================================
     LOAD SETTINGS
  ====================================================== */

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      try {
        const prefs = await settingsService.get();

        if (!mounted) return;

        const loaded: DantifySettings = {
          ...DEFAULT_SETTINGS,
          ...prefs,
        };

        setSettings(loaded);
        await setMode(mapTheme(loaded.theme));
      } catch (error) {
        console.error('Failed to load settings:', error);

        if (mounted) {
          Alert.alert(
            'Settings',
            'Could not load saved settings. Default settings will be used.',
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadSettings();

    return () => {
      mounted = false;
    };
  }, [setMode]);

  /* ======================================================
     UPDATE SETTINGS
  ====================================================== */

  const updateSetting = async <
    K extends keyof DantifySettings,
  >(
    key: K,
    value: DantifySettings[K],
  ) => {
    if (saving) return;

    const previous = settings;
    const next: DantifySettings = {
      ...previous,
      [key]: value,
    };

    setSettings(next);
    setSaving(true);

    try {
      if (key === 'theme') {
        await setMode(
          mapTheme(value as DantifySettings['theme']),
        );
      }

      await settingsService.save(next);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSettings(previous);

      if (key === 'theme') {
        try {
          await setMode(mapTheme(previous.theme));
        } catch (themeError) {
          console.error('Failed to restore theme:', themeError);
        }
      }

      Alert.alert(
        'Save Failed',
        'Your setting could not be saved. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  /* ======================================================
     THEME OPTIONS
  ====================================================== */

  const renderThemeOptions = () => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>App Theme</Text>

    <Text style={[styles.metaText, styles.settingsDescription]}>
      Choose how Dantify appears on your device.
    </Text>

    <View style={styles.settingsThemeOptions}>
      {THEMES.map((theme) => {
        const selected = settings.theme === theme;

        return (
          <Pressable
            key={theme}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            disabled={saving}
            onPress={() => {
              if (theme !== settings.theme) {
                void updateSetting("theme", theme);
              }
            }}
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
              {theme}
            </Text>
          </Pressable>
        );
      })}
    </View>
  </View>
);

  /* ======================================================
     TOGGLE ROW
  ====================================================== */

  const renderToggle = (
    title: string,
    description: string,
    value: boolean,
    onToggle: (nextValue: boolean) => void,
  ) => (
    <View style={styles.card}>
      <View style={styles.settingsToggleRow}>
        <View style={styles.settingsToggleText}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.metaText}>{description}</Text>
        </View>

        <Switch
          value={value}
          disabled={saving}
          onValueChange={onToggle}
          trackColor={{
            false: COLORS.border,
            true: COLORS.primary,
          }}
          thumbColor="#FFFFFF"
          accessibilityLabel={title}
        />
      </View>
    </View>
  );

  /* ======================================================
     LOADING
  ====================================================== */

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.settingsCenter,
        ]}
      >
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />

        <Text style={[styles.metaText, styles.settingsLoadingText]}>
          Loading settings...
        </Text>
      </View>
    );
  }

  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <View style={styles.container}>
      <View style={styles.settingsHeader}>
        <Text
          style={[
            styles.title,
            styles.settingsHeaderTitle,
          ]}
        >
          Settings
        </Text>

        {saving && (
          <ActivityIndicator
            size="small"
            color={COLORS.primary}
          />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.sectionLabel}>Appearance</Text>
        {renderThemeOptions()}

        <Text style={styles.sectionLabel}>Notifications</Text>

        {renderToggle(
          'Enable Notifications',
          'Receive important updates and alerts.',
          settings.notifications,
          (value) => {
            void updateSetting('notifications', value);
          },
        )}

        {renderToggle(
          'Appointment Reminders',
          'Get reminders for upcoming appointments.',
          settings.appointmentReminders,
          (value) => {
            void updateSetting('appointmentReminders', value);
          },
        )}

        <Text style={styles.sectionLabel}>Account</Text>

        <Pressable
          style={styles.card}
          accessibilityRole="button"
          onPress={() => router.push('/(auth)/register')}
        >
          <Text style={styles.cardTitle}>Profile</Text>
          <Text style={styles.metaText}>
            View or update your profile information.
          </Text>
        </Pressable>

        <Pressable
          style={styles.card}
          accessibilityRole="button"
          onPress={() =>
            Alert.alert(
              'Change Password',
              'Password change is not yet connected to the API.',
            )
          }
        >
          <Text style={styles.cardTitle}>Change Password</Text>
          <Text style={styles.metaText}>
            Update your account password.
          </Text>
        </Pressable>

        <Text style={[styles.metaText, styles.settingsFooter]}>
          Dantify Dental Practice Management System
        </Text>
      </ScrollView>
    </View>
  );
}