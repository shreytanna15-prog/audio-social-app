import { DarkTheme, DefaultTheme } from 'expo-router';

import { SemanticColors, StudioColors } from '@/core/theme/tokens';

export const THEME = {
  light: {
    background: SemanticColors.background,
    foreground: SemanticColors.foreground,
    card: SemanticColors.card,
    cardForeground: SemanticColors.cardForeground,
    popover: SemanticColors.popover,
    popoverForeground: SemanticColors.popoverForeground,
    primary: SemanticColors.primary,
    primaryForeground: SemanticColors.primaryForeground,
    secondary: SemanticColors.secondary,
    secondaryForeground: SemanticColors.secondaryForeground,
    muted: SemanticColors.muted,
    mutedForeground: SemanticColors.mutedForeground,
    accent: SemanticColors.accent,
    accentForeground: SemanticColors.accentForeground,
    destructive: SemanticColors.destructive,
    border: SemanticColors.border,
    input: SemanticColors.input,
    ring: SemanticColors.ring,
    radius: '0.75rem',
    chart1: StudioColors.brand,
    chart2: StudioColors.magenta,
    chart3: StudioColors.lavender,
    chart4: StudioColors.monitor,
    chart5: StudioColors.peak,
  },
  dark: {
    background: SemanticColors.background,
    foreground: SemanticColors.foreground,
    card: SemanticColors.card,
    cardForeground: SemanticColors.cardForeground,
    popover: SemanticColors.popover,
    popoverForeground: SemanticColors.popoverForeground,
    primary: SemanticColors.primary,
    primaryForeground: SemanticColors.primaryForeground,
    secondary: SemanticColors.secondary,
    secondaryForeground: SemanticColors.secondaryForeground,
    muted: SemanticColors.muted,
    mutedForeground: SemanticColors.mutedForeground,
    accent: SemanticColors.accent,
    accentForeground: SemanticColors.accentForeground,
    destructive: SemanticColors.destructive,
    border: SemanticColors.border,
    input: SemanticColors.input,
    ring: SemanticColors.ring,
    radius: '0.75rem',
    chart1: StudioColors.brand,
    chart2: StudioColors.magenta,
    chart3: StudioColors.lavender,
    chart4: StudioColors.monitor,
    chart5: StudioColors.peak,
  },
};

type NavTheme = typeof DefaultTheme;

const studioNavColors = {
  background: SemanticColors.background,
  border: SemanticColors.border,
  card: SemanticColors.card,
  notification: StudioColors.recording,
  primary: SemanticColors.primary,
  text: SemanticColors.foreground,
};

export const NAV_THEME: Record<'light' | 'dark', NavTheme> = {
  light: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      ...studioNavColors,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      ...studioNavColors,
    },
  },
};
