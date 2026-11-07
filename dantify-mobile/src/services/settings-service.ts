import AsyncStorage from '@react-native-async-storage/async-storage';

/* ======================================================
   TYPES
====================================================== */

export type AppTheme = 'System' | 'Light' | 'Dark';

export interface DantifySettings {
  theme: AppTheme;
  notifications: boolean;
  appointmentReminders: boolean;
}

/* ======================================================
   STORAGE KEY
====================================================== */

const STORAGE_KEY = 'DANTIFY_SETTINGS';

/* ======================================================
   DEFAULT SETTINGS
====================================================== */

const DEFAULTS: DantifySettings = {
  theme: 'System',
  notifications: true,
  appointmentReminders: true,
};

/* ======================================================
   HELPERS
====================================================== */

/**
 * Return a fresh copy of the default settings.
 */
const getDefaultSettings = (): DantifySettings => ({
  ...DEFAULTS,
});

/**
 * Validate and normalize settings retrieved from storage.
 *
 * Invalid or missing values fall back to defaults.
 */
const normalizeSettings = (value: unknown): DantifySettings => {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    return getDefaultSettings();
  }

  const stored = value as Record<string, unknown>;

  const theme: AppTheme =
    stored.theme === 'System' ||
    stored.theme === 'Light' ||
    stored.theme === 'Dark'
      ? stored.theme
      : DEFAULTS.theme;

  return {
    theme,
    notifications:
      typeof stored.notifications === 'boolean'
        ? stored.notifications
        : DEFAULTS.notifications,

    appointmentReminders:
      typeof stored.appointmentReminders === 'boolean'
        ? stored.appointmentReminders
        : DEFAULTS.appointmentReminders,
  };
};

/* ======================================================
   SETTINGS SERVICE
====================================================== */

export const settingsService = {

  /**
   * Retrieve application settings.
   *
   * Returns defaults when no settings exist or
   * stored data cannot be parsed.
   */
  async get(): Promise<DantifySettings> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return getDefaultSettings();
      }

      const parsed: unknown = JSON.parse(raw);

      return normalizeSettings(parsed);
    } catch (error) {
      console.warn('[Settings] Unable to load settings:', error);

      return getDefaultSettings();
    }
  },

  /**
   * Save application settings.
   */
  async save(settings: DantifySettings): Promise<void> {
    const normalized = normalizeSettings(settings);

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(normalized),
    );
  },

  /**
   * Restore default settings and persist them.
   */
  async reset(): Promise<DantifySettings> {
    const defaults = getDefaultSettings();

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(defaults),
    );

    return defaults;
  },
};

/* ======================================================
   EXPORT
====================================================== */

export default settingsService;