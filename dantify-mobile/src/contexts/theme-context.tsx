
/* src/contexts/theme-context.tsx */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

import {
  getColors,
  type ResolvedTheme,
  type ThemeColors,
  type ThemeMode,
} from '@/constants/theme';

/* ======================================================
   STORAGE
====================================================== */

const THEME_STORAGE_KEY = '@dantify:theme:mode';

const isThemeMode = (value: string | null): value is ThemeMode =>
  value === 'light' || value === 'dark' || value === 'system';

/* ======================================================
   CONTEXT TYPES
====================================================== */

type ThemeContextType = {
  mode: ThemeMode;
  resolvedMode: ResolvedTheme;
  theme: ResolvedTheme;
  colors: ThemeColors;
  isThemeLoading: boolean;

  /** Cycle through light → dark → system → light. */
  toggle: () => Promise<void>;

  /** Set an explicit appearance preference. */
  setMode: (mode: ThemeMode) => Promise<void>;
};

/* ======================================================
   CONTEXT
====================================================== */

const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);

/* ======================================================
   PROVIDER
====================================================== */

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const systemScheme = useColorScheme();

  const [mode, setModeState] = useState<ThemeMode>('system');
  const [isThemeLoading, setIsThemeLoading] = useState(true);

  /* ======================================================
     LOAD SAVED PREFERENCE
  ====================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadTheme = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(
          THEME_STORAGE_KEY,
        );

        if (!cancelled && isThemeMode(savedMode)) {
          setModeState(savedMode);
        }
      } catch (error) {
        console.warn(
          '[Theme] Could not restore saved preference:',
          error,
        );
      } finally {
        if (!cancelled) {
          setIsThemeLoading(false);
        }
      }
    };

    void loadTheme();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ======================================================
     RESOLVE ACTIVE THEME
  ====================================================== */

  const resolvedMode: ResolvedTheme =
    mode === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : mode;

  /* ======================================================
     SET THEME
  ====================================================== */

  const setMode = useCallback(async (nextMode: ThemeMode) => {
    // Update immediately for a responsive interface.
    setModeState(nextMode);

    try {
      await AsyncStorage.setItem(
        THEME_STORAGE_KEY,
        nextMode,
      );
    } catch (error) {
      console.warn(
        '[Theme] Could not save preference:',
        error,
      );
    }
  }, []);

  /* ======================================================
     CYCLE THEME
  ====================================================== */

  const toggle = useCallback(async () => {
    const nextMode: ThemeMode =
      mode === 'light'
        ? 'dark'
        : mode === 'dark'
          ? 'system'
          : 'light';

    await setMode(nextMode);
  }, [mode, setMode]);

  /* ======================================================
     CONTEXT VALUE
  ====================================================== */

  const value = useMemo<ThemeContextType>(
    () => ({
      mode,
      resolvedMode,
      theme: resolvedMode,
      colors: getColors(resolvedMode),
      isThemeLoading,
      toggle,
      setMode,
    }),
    [
      mode,
      resolvedMode,
      isThemeLoading,
      toggle,
      setMode,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/* ======================================================
   HOOK
====================================================== */

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useTheme must be used within ThemeProvider.',
    );
  }

  return context;
};
