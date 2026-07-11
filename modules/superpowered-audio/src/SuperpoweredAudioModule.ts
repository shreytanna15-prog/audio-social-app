import { requireNativeModule } from 'expo-modules-core';

import type {
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
};

export default requireNativeModule<SuperpoweredAudioNativeModule>('SuperpoweredAudio');
