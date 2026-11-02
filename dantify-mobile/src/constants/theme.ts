
import '@/global.css';

import { Platform, useColorScheme as useNativeColorScheme } from 'react-native';

/* ======================================================
   THEME MODE
====================================================== */

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

/* ======================================================
   LIGHT MODE
====================================================== */

export const lightColors = {
  // Brand
  primary: '#D92587',
  secondary: '#6C2BD9',

  // Status
  success: '#1B9C73',
  warning: '#F7B43F',
  danger: '#E24646',
  error: '#E24646',
  info: '#3C7DFF',

  // Surfaces
  appBackground: '#F6F2FB',
  background: '#F6F2FB',
  backgroundElement: '#F3EDF9',
  backgroundSelected: '#E0D4F2',
  surface: '#FFFFFF',
  card: '#FDFBFF',
  border: '#E0D4F2',
  divider: '#E0D4F2',
  disabled: '#C4B8D8',

  // Neutrals
  white: '#FFFFFF',
  lightGray: '#F3EDF9',

  // Typography
  text: '#231529',
  legendText: '#33273F',
  textSecondary: '#665379',
  textMuted: '#9A8EAE',
  textInverse: '#FFFFFF',

  // Shadows
  cardShadow: 'rgba(33, 10, 63, 0.18)',

  // Charts
  chartFill: '#2A1538',

  // Utility colors
  red: '#E24646',
  green: '#1B9C73',
  blue: '#3C7DFF',
  yellow: '#F7B43F',

  // Navigation
  tabBg: '#FFFFFF',
  tabBorderTop: '#E0D4F2',
  tabActive: '#D92587',
  tabActiveAlt: '#6C2BD9',
  tabInactive: '#B4A4CC',

  // Badges
  badgeBg: '#D92587',
  badgeText: '#FFFFFF',

  // Skeleton loaders
  skeleton: '#ECE5F5',
} as const;

/* ======================================================
   DARK MODE
====================================================== */

export const darkColors = {
  // Brand
  primary: '#F15AAE',
  secondary: '#A26BFF',

  // Status
  success: '#34D0A1',
  warning: '#FBD37A',
  danger: '#FF6B74',
  error: '#FF6B74',
  info: '#5C98FF',

  // Surfaces
  appBackground: '#0C0614',
  background: '#0C0614',
  backgroundElement: '#221431',
  backgroundSelected: '#3B264E',
  surface: '#1A1027',
  card: '#221431',
  border: '#3B264E',
  divider: '#3B264E',
  disabled: '#4C3D66',

  // Neutrals
  white: '#FFFFFF',
  lightGray: '#2C203A',

  // Typography
  text: '#F9F4FF',
  legendText: '#F2E8FF',
  textSecondary: '#C8B9E3',
  textMuted: '#9C8BBE',
  textInverse: '#1A1027',

  // Shadows
  cardShadow: 'rgba(0, 0, 0, 0.7)',

  // Charts
  chartFill: '#F4E4FF',

  // Utility colors
  red: '#FF6B74',
  green: '#34D0A1',
  blue: '#5C98FF',
  yellow: '#FBD37A',

  // Navigation
  tabBg: '#0F071A',
  tabBorderTop: '#3B264E',
  tabActive: '#F15AAE',
  tabActiveAlt: '#A26BFF',
  tabInactive: '#746391',

  // Badges
  badgeBg: '#F15AAE',
  badgeText: '#1A1027',

  // Skeleton loaders
  skeleton: '#2A1C3A',
} as const;

/* ======================================================
   CHART COLORS
====================================================== */

export const CHART_COLORS = {
  violet: '#A26BFF',
  teal: '#1B9C73',
  coral: '#FF7A5C',
  blue: '#5C98FF',
  purple: '#6C2BD9',
  amber: '#F7B43F',
  pink: '#F15AAE',
  green: '#34D0A1',
  sky: '#46C3FF',
  peach: '#FF9A7A',
} as const;

/* ======================================================
   COLOR TYPES AND HELPERS
====================================================== */

export type ThemeColors = {
  [K in keyof typeof lightColors]: string;
};

export type ThemeColor = keyof ThemeColors;

export const getColors = (mode: ResolvedTheme): ThemeColors =>
  mode === 'dark' ? darkColors : lightColors;

/**
 * Backward-compatible navigation colors.
 */
export const Colors = {
  light: {
    ...lightColors,
    tint: lightColors.primary,
    iconDefault: lightColors.textSecondary,
  },
  dark: {
    ...darkColors,
    tint: darkColors.primary,
    iconDefault: darkColors.textSecondary,
  },
} as const;

/* ======================================================
   SYSTEM THEME SUPPORT
====================================================== */

/**
 * Returns the active light/dark theme.
 * When mode is "system", follows the device appearance.
 *
 * Requires the component to call this hook.
 */
export function useResolvedTheme(
  mode: ThemeMode = 'system'
): ResolvedTheme {
  const systemScheme = useNativeColorScheme();

  if (mode === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }

  return mode;
}

/* ======================================================
   FONT FAMILY TOKENS
====================================================== */

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono:
      "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

/* ======================================================
   SPACING AND LAYOUT
====================================================== */

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({
  ios: 50,
  android: 80,
}) ?? 0;

export const MaxContentWidth = 800;
