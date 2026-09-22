import { SemanticColors, StudioColors } from './tokens';

/**
 * Lightweight theme for tabs / StyleSheet consumers.
 * Prefer Tailwind semantic classes in JSX; use this when you need hex values.
 */
export const Colors = {
  light: {
    text: SemanticColors.foreground,
    background: SemanticColors.background,
    backgroundElement: StudioColors.surfaceContainer,
    backgroundSelected: StudioColors.surfaceContainerHigh,
    textSecondary: StudioColors.slate,
    primary: SemanticColors.primary,
    secondary: SemanticColors.secondary,
    border: SemanticColors.border,
  },
  dark: {
    text: SemanticColors.foreground,
    background: SemanticColors.background,
    backgroundElement: StudioColors.surfaceContainer,
    backgroundSelected: StudioColors.surfaceContainerHigh,
    textSecondary: StudioColors.slate,
    primary: SemanticColors.primary,
    secondary: SemanticColors.secondary,
    border: SemanticColors.border,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
