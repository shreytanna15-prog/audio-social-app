import { Platform } from 'react-native';

import { Space } from './tokens';

export { Space, Radius } from './tokens';

/** Legacy spacing keys — prefer `Space` / Tailwind `gap-md` going forward */
export const Spacing = {
  half: 2,
  one: Space.xs,
  two: Space.sm,
  three: Space.md,
  four: Space.lg,
  five: 32,
  six: 64,
  xs: Space.xs,
  sm: Space.sm,
  md: Space.md,
  lg: Space.lg,
  xl: Space.xl,
  gutter: Space.gutter,
  margin: Space.margin,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 1440;
