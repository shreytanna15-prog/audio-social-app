import type { AudioEffectId } from '@/module/audio/types/effects';

export type EffectParamValue = number | string | boolean;

export type EffectParamValues = Record<string, EffectParamValue>;

export type AppliedEffect = {
  id: AudioEffectId;
  params: EffectParamValues;
};

export type DenoiseProfileId = 'crowd' | 'voices' | 'steady';
