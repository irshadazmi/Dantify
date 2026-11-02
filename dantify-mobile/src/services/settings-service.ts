import AsyncStorage from "@react-native-async-storage/async-storage";

/* ======================================================
   TYPES
====================================================== */

export type DantifySettings = {
  theme: "System" | "Light" | "Dark";
  notifications: boolean;
  appointmentReminders: boolean;
};

/* ======================================================
   STORAGE KEY
====================================================== */

const KEY = "DANTIFY_SETTINGS";

/* ======================================================
   DEFAULTS
====================================================== */

const DEFAULTS: DantifySettings = {
  theme: "System",
  notifications: true,
  appointmentReminders: true,
};

/* ======================================================
   SERVICE
====================================================== */

export const settingsService = {
  async get(): Promise<DantifySettings> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  },

  async save(settings: DantifySettings): Promise<void> {
    await AsyncStorage.setItem(KEY, JSON.stringify(settings));
  },
};
