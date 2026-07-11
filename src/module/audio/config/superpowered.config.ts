import Constants from 'expo-constants';

/**
 * Superpowered Evaluation / White Label license key.
 * Set `EXPO_PUBLIC_SUPERPOWERED_LICENSE_KEY` in `.env` (see `.env.example`).
 * Register at https://superpowered.com/ (Evaluation is OK for development builds).
 */
export function getSuperpoweredLicenseKey(): string | null {
  const fromEnv = process.env.EXPO_PUBLIC_SUPERPOWERED_LICENSE_KEY?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  const fromExtra = Constants.expoConfig?.extra?.superpoweredLicenseKey;
  if (typeof fromExtra === 'string' && fromExtra.trim().length > 0) {
    return fromExtra.trim();
  }

  return null;
}

export function isSuperpoweredLicenseConfigured(): boolean {
  return getSuperpoweredLicenseKey() != null;
}
