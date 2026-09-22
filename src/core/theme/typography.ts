import { Platform } from 'react-native';

import { FontFamilies } from './tokens';

export { FontFamilies, TypeScale } from './tokens';

export const Fonts = Platform.select({
  ios: {
    sans: FontFamilies.sans,
    display: FontFamilies.display,
    serif: 'ui-serif',
    rounded: FontFamilies.display,
    mono: FontFamilies.mono,
  },
  android: {
    sans: FontFamilies.sans,
    display: FontFamilies.display,
    serif: 'serif',
    rounded: FontFamilies.display,
    mono: FontFamilies.mono,
  },
  default: {
    sans: FontFamilies.sans,
    display: FontFamilies.display,
    serif: 'serif',
    rounded: FontFamilies.display,
    mono: FontFamilies.mono,
  },
  web: {
    sans: 'var(--font-sans-stack)',
    display: 'var(--font-display-stack)',
    serif: 'var(--font-serif-stack)',
    rounded: 'var(--font-rounded-stack)',
    mono: 'var(--font-mono-stack)',
  },
});
