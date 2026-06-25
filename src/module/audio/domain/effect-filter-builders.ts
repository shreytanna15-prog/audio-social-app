import type { EffectParamValues } from '@/module/audio/types/applied-effects';
import type { AudioEffectId } from '@/module/audio/types/effects';
import { escapeFfmpegFilterPath } from '@/module/audio/utils/ffmpeg-path';

import { getDefaultEffectParams } from './effect-definitions';

export type DenoiseStrength = 'light' | 'medium' | 'strong';

export type DenoiseStrategy = 'arnndn-with-mix' | 'arnndn' | 'afftdn';

type BuildDenoiseOptions = {
  strategy?: DenoiseStrategy;
  arnndnModelPath?: string | null;
};

const STATIC_EFFECT_FILTERS: Record<Exclude<AudioEffectId, 'denoise'>, string> = {
  reverb: 'aecho=0.8:0.88:40|120|280:0.4|0.25|0.15',
  echo: 'aecho=0.8:0.9:1000:0.35',
  modulate: 'tremolo=f=6:d=0.45,vibrato=f=5:d=0.35',
  enhance:
    'loudnorm=I=-14:TP=-1.5:LRA=11,acompressor=threshold=-18dB:ratio=3:attack=5:release=50,equalizer=f=3000:width_type=o:gain=2',
};

const AFFTDN_SETTINGS = {
  noiseFloor: -50,
  gainSmooth: 14,
  adaptivity: 0.6,
  residualFloor: -45,
};

const STRENGTH_TO_NR: Record<DenoiseStrength, number> = {
  light: 26,
  medium: 30,
  strong: 34,
};

const STRENGTH_TO_MIX: Record<DenoiseStrength, number> = {
  light: 0.75,
  medium: 0.8,
  strong: 0.85,
};

function normalizeStrength(value: EffectParamValues[string]): DenoiseStrength {
  if (value === 'light' || value === 'medium' || value === 'strong') {
    return value;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 'medium';
  }

  if (numericValue <= 5) {
    if (numericValue <= 2) {
      return 'light';
    }

    if (numericValue >= 4) {
      return 'strong';
    }

    return 'medium';
  }

  // Legacy saves used 40–100 percent strength.
  if (numericValue <= 55) {
    return 'light';
  }

  if (numericValue >= 80) {
    return 'strong';
  }

  return 'medium';
}

function parseDenoiseStrength(params: EffectParamValues): DenoiseStrength {
  return normalizeStrength(params.strength ?? 'medium');
}

/**
 * Speech denoise via arnndn (RNNoise): highpass → arnndn → loudnorm.
 * Kept intentionally minimal so the neural denoiser effect is easier to judge.
 *
 * @see https://ffmpeg.org/ffmpeg-filters.html#arnndn
 */
function buildArnndnDenoiseAudioFilter(
  modelPath: string,
  params: EffectParamValues,
  includeMix: boolean,
): string {
  const strength = parseDenoiseStrength(params);
  const mix = STRENGTH_TO_MIX[strength];
  const escapedModelPath = escapeFfmpegFilterPath(modelPath);
  const stages: string[] = ['highpass=f=80'];

  stages.push(
    includeMix
      ? `arnndn=m=${escapedModelPath}:mix=${mix}`
      : `arnndn=m=${escapedModelPath}`,
  );

  stages.push('loudnorm=I=-16:TP=-1.5:LRA=11');

  return stages.join(',');
}

/**
 * FFT denoise fallback: highpass → afftdn.
 *
 * @see https://ffmpeg.org/ffmpeg-filters.html#afftdn
 */
function buildAfftdnDenoiseAudioFilter(params: EffectParamValues): string {
  const strength = parseDenoiseStrength(params);
  const noiseReduction = STRENGTH_TO_NR[strength];

  return [
    'highpass=f=85',
    `afftdn=nr=${noiseReduction}:nf=${AFFTDN_SETTINGS.noiseFloor}:tn=1:tr=1:gs=${AFFTDN_SETTINGS.gainSmooth}:ad=${AFFTDN_SETTINGS.adaptivity}:rf=${AFFTDN_SETTINGS.residualFloor}`,
  ].join(',');
}

export function buildDenoiseAudioFilter(
  params: EffectParamValues,
  options: BuildDenoiseOptions = {},
): string {
  const strategy = options.strategy ?? (options.arnndnModelPath ? 'arnndn-with-mix' : 'afftdn');

  if (
    (strategy === 'arnndn-with-mix' || strategy === 'arnndn') &&
    options.arnndnModelPath
  ) {
    return buildArnndnDenoiseAudioFilter(
      options.arnndnModelPath,
      params,
      strategy === 'arnndn-with-mix',
    );
  }

  return buildAfftdnDenoiseAudioFilter(params);
}

export function buildEffectAudioFilter(
  effectId: AudioEffectId,
  params: EffectParamValues,
  denoiseOptions?: BuildDenoiseOptions,
): string {
  if (effectId === 'denoise') {
    return buildDenoiseAudioFilter(params, denoiseOptions);
  }

  return STATIC_EFFECT_FILTERS[effectId];
}

export function buildEffectAudioFilterFromDefaults(effectId: AudioEffectId): string {
  return buildEffectAudioFilter(effectId, getDefaultEffectParams(effectId));
}
