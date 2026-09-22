import { Colors } from './colors';
import { useColorScheme } from './use-color-scheme';

export function useTheme() {
  const scheme = useColorScheme();
  // Studio Noir is dark-first; treat unspecified as dark
  const theme = scheme === 'light' ? 'light' : 'dark';

  return Colors[theme];
}
