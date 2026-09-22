/**
 * VibeOGram — Studio Noir Atmosphere
 * Canonical design tokens. Prefer Tailwind classes (`bg-primary`, `text-on-surface`)
 * in UI; import from here for StyleSheet / Reanimated / non-className code.
 *
 * Source of truth for prose: `/DESIGN.md`
 */

export const StudioColors = {
  // Material tonal surfaces (frontmatter)
  surface: '#131319',
  surfaceDim: '#131319',
  surfaceBright: '#39383f',
  surfaceContainerLowest: '#0e0e14',
  surfaceContainerLow: '#1b1b21',
  surfaceContainer: '#1f1f25',
  surfaceContainerHigh: '#2a2930',
  surfaceContainerHighest: '#34343b',
  onSurface: '#e4e1ea',
  onSurfaceVariant: '#cbc3d7',
  inverseSurface: '#e4e1ea',
  inverseOnSurface: '#303036',
  outline: '#958ea0',
  outlineVariant: '#494454',
  surfaceTint: '#d0bcff',

  // MD3 roles
  primaryTonal: '#d0bcff',
  onPrimary: '#3c0091',
  primaryContainer: '#a078ff',
  onPrimaryContainer: '#340080',
  inversePrimary: '#6d3bd7',
  secondaryTonal: '#ffb0cd',
  onSecondary: '#640039',
  secondaryContainer: '#aa0266',
  onSecondaryContainer: '#ffbad3',
  tertiaryTonal: '#ccbeff',
  onTertiary: '#332664',
  tertiaryContainer: '#9587cc',
  onTertiaryContainer: '#2c1f5c',
  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',
  background: '#131319',
  onBackground: '#e4e1ea',
  surfaceVariant: '#34343b',

  // Brand signal (palette board + CTA)
  brand: '#8B5CF6',
  brandDeep: '#7C3AED',
  magenta: '#EC4899',
  magentaDeep: '#D946EF',
  lavender: '#C4B5FD',
  lavenderSoft: '#DDD6FE',
  neutral: '#121218',
  canvas: '#0B0B0F',
  panel: '#1A1A24',
  float: '#222230',
  hairline: '#2A2A3C',

  // Typography neutrals
  ink: '#F8FAFC',
  slate: '#94A3B8',
  slateMuted: '#475569',

  // Studio metrics
  recording: '#EF4444',
  monitor: '#10B981',
  peak: '#F59E0B',

  // Glass / borders (use as strings in StyleSheet)
  borderSubtle: 'rgba(255, 255, 255, 0.05)',
  borderSoft: 'rgba(255, 255, 255, 0.07)',
  borderGlass: 'rgba(255, 255, 255, 0.1)',
  borderTransport: 'rgba(255, 255, 255, 0.12)',
  glassFill: 'rgba(255, 255, 255, 0.06)',
  waveformIdle: 'rgba(255, 255, 255, 0.2)',
  chipActiveBg: 'rgba(196, 181, 253, 0.15)',
  chipActiveBorder: 'rgba(196, 181, 253, 0.3)',
  violetRim: 'rgba(139, 92, 246, 0.2)',
  violetGlow: 'rgba(139, 92, 246, 0.2)',
  recordGlow: 'rgba(239, 68, 68, 0.2)',
} as const;

/** shadcn / RNR semantic mapping used by Button, Input, etc. (dark-first) */
export const SemanticColors = {
  background: StudioColors.background,
  foreground: StudioColors.onBackground,
  card: StudioColors.panel,
  cardForeground: StudioColors.onSurface,
  popover: StudioColors.float,
  popoverForeground: StudioColors.onSurface,
  /** CTA fill — Electric Violet */
  primary: StudioColors.brand,
  primaryForeground: StudioColors.ink,
  /** Magenta resonance */
  secondary: StudioColors.magenta,
  secondaryForeground: StudioColors.ink,
  muted: StudioColors.surfaceContainer,
  mutedForeground: StudioColors.slate,
  accent: StudioColors.surfaceContainerHigh,
  accentForeground: StudioColors.lavender,
  destructive: StudioColors.recording,
  border: StudioColors.hairline,
  input: StudioColors.canvas,
  ring: StudioColors.brand,
} as const;

export const FontFamilies = {
  display: 'Space Grotesk',
  sans: 'Inter',
  mono: 'Space Grotesk',
} as const;

export const TypeScale = {
  displayHero: {
    fontFamily: FontFamilies.display,
    fontSize: 48,
    fontWeight: '700' as const,
    lineHeight: 56,
    letterSpacing: -1.44,
  },
  displayHeroMobile: {
    fontFamily: FontFamilies.display,
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.64,
  },
  headlineLg: {
    fontFamily: FontFamilies.display,
    fontSize: 32,
    fontWeight: '600' as const,
    lineHeight: 40,
    letterSpacing: -0.64,
  },
  headlineLgMobile: {
    fontFamily: FontFamilies.display,
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    letterSpacing: -0.24,
  },
  headlineMd: {
    fontFamily: FontFamilies.display,
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: -0.22,
  },
  titleLg: {
    fontFamily: FontFamilies.sans,
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: -0.18,
  },
  titleMd: {
    fontFamily: FontFamilies.sans,
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodyLg: {
    fontFamily: FontFamilies.sans,
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyMd: {
    fontFamily: FontFamilies.sans,
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },
  labelMd: {
    fontFamily: FontFamilies.sans,
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
    letterSpacing: 0.13,
  },
  labelSm: {
    fontFamily: FontFamilies.sans,
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.24,
  },
  monoMetric: {
    fontFamily: FontFamilies.mono,
    fontSize: 12,
    fontWeight: '700' as const,
    lineHeight: 14,
    letterSpacing: 0.6,
  },
  caption: {
    fontFamily: FontFamilies.sans,
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 14,
    letterSpacing: 0,
  },
} as const;

/** 4px base unit */
export const Space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
  gutter: 16,
  gutterDesktop: 24,
  margin: 16,
  marginTablet: 32,
  marginDesktop: 48,
} as const;

export const Radius = {
  sm: 4,
  DEFAULT: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export type StudioColorToken = keyof typeof StudioColors;
export type SemanticColorToken = keyof typeof SemanticColors;
export type TypeScaleToken = keyof typeof TypeScale;
