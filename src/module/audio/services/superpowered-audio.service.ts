import { Platform } from 'react-native';

import { getSuperpoweredLicenseKey } from '@/module/audio/config/superpowered.config';
import type {
  SuperpoweredProcessOptions,
  SuperpoweredProcessResult,
} from 'superpowered-audio';

export type {
  SuperpoweredProcessOptions,
  SuperpoweredProcessPreset,
  SuperpoweredProcessResult,
} from 'superpowered-audio';

type SuperpoweredNativeModule = {
  isAvailable: () => boolean;
  init: (licenseKey: string) => boolean;
  processFile: (
    inputUri: string,
    outputUri: string,
    options: SuperpoweredProcessOptions,
  ) => Promise<SuperpoweredProcessResult>;
};

let nativeModule: SuperpoweredNativeModule | null | undefined;
let didInit = false;

function resolveNativeModule(): SuperpoweredNativeModule | null {
  if (nativeModule !== undefined) {
    return nativeModule;
  }

  if (Platform.OS === 'web') {
    nativeModule = null;
    return null;
  }

  try {
    // Local Expo module — present after prebuild + native rebuild.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const loaded = require('superpowered-audio').default as SuperpoweredNativeModule;
    nativeModule = loaded;
    return loaded;
  } catch (error) {
    console.info(
      '[Superpowered] Native module not linked yet (run a native rebuild).',
      error instanceof Error ? error.message : error,
    );
    nativeModule = null;
    return null;
  }
}

/** True only when the native module is linked and reports ready. Never throws. */
export function isSuperpoweredAvailable(): boolean {
  const module = resolveNativeModule();
  if (module == null) {
    return false;
  }

  try {
    return module.isAvailable() === true;
  } catch {
    return false;
  }
}

/**
 * Initializes Superpowered with the configured license key.
 * Returns false (never throws) when the module/key is missing or init fails.
 */
export async function initSuperpowered(licenseKey?: string): Promise<boolean> {
  const module = resolveNativeModule();
  if (module == null) {
    return false;
  }

  const key = licenseKey?.trim() || getSuperpoweredLicenseKey();
  if (!key) {
    console.warn(
      '[Superpowered] No license key. Set EXPO_PUBLIC_SUPERPOWERED_LICENSE_KEY in .env',
    );
    return false;
  }

  try {
    const ok = module.init(key) === true;
    didInit = ok;
    if (ok) {
      console.info('[Superpowered] init OK (native Initialize + polish DSP ready).');
    } else {
      console.warn('[Superpowered] init returned false.');
    }
    return ok;
  } catch (error) {
    didInit = false;
    console.warn('[Superpowered] init failed.', error);
    return false;
  }
}

export function isSuperpoweredInitialized(): boolean {
  return didInit && isSuperpoweredAvailable();
}

/**
 * Offline file polish via Superpowered (EQ → compressor → limiter → WAV).
 * Prefer `polishRecordingWithSuperpowered` for M4A encode + presets.
 */
export async function processFileWithSuperpowered(
  inputUri: string,
  outputUri: string,
  options: SuperpoweredProcessOptions = {},
): Promise<SuperpoweredProcessResult> {
  const module = resolveNativeModule();
  if (module == null) {
    throw new Error('Superpowered native module is not available in this build.');
  }

  if (!didInit) {
    const initialized = await initSuperpowered();
    if (!initialized) {
      throw new Error('Superpowered failed to initialize (missing license key or native module).');
    }
  }

  return module.processFile(inputUri, outputUri, options);
}
