import { requireNativeModule } from 'expo-modules-core';

import type {
  SpectralCleanProcessResult,
  SuperpoweredEffectsProcessResult,
  SuperpoweredProcessOptions,
  SuperpoweredProcessResult,
} from './SuperpoweredAudio.types';

type SuperpoweredAudioNativeModule = {
  isAvailable(): boolean;
  init(licenseKey: string): boolean;
  processFile(
    inputUri: string,
    outputUri: string,
    options: SuperpoweredProcessOptions,
  ): Promise<SuperpoweredProcessResult>;
  spectralCleanProcessFile(
    inputUri: string,
    outputUri: string,
    intensity?: string | null,
  ): Promise<SpectralCleanProcessResult>;
  processEffectsFile(
    inputUri: string,
    outputUri: string,
    effectsJson: string,
  ): Promise<SuperpoweredEffectsProcessResult>;
};

export default requireNativeModule<SuperpoweredAudioNativeModule>('SuperpoweredAudio');
