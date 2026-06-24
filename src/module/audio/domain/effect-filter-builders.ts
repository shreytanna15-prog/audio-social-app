import type { EffectParamValues } from '@/module/audio/types/applied-effects';
import type { AudioEffectId } from '@/module/audio/types/effects';

import { getDefaultEffectParams } from './effect-definitions';

export type DenoiseProfileId = 'crowd' | 'voices' | 'steady';

type DenoiseParams = {
  strength: number;
  profile: DenoiseProfileId;
  reduceRumble: boolean;
  reduceHiss: boolean;
};

const STATIC_EFFECT_FILTERS: Record<Exclude<AudioEffectId, 'denoise'>, string> = {
  reverb: 'aecho=0.8:0.88:40|120|280:0.4|0.25|0.15',
  echo: 'aecho=0.8:0.9:1000:0.35',
  modulate: 'tremolo=f=6:d=0.45,vibrato=f=5:d=0.35',
  enhance:
    'loudnorm=I=-14:TP=-1.5:LRA=11,acompressor=threshold=-18dB:ratio=3:attack=5:release=50,equalizer=f=3000:width_type=o:gain=2',
};

const PROFILE_SETTINGS: Record<
  DenoiseProfileId,
  { noiseFloor: number; gainSmooth: number; adaptivity: number }
> = {
  crowd: { noiseFloor: -38, gainSmooth: 12, adaptivity: 0.35 },
  voices: { noiseFloor: -40, gainSmooth: 10, adaptivity: 0.4 },
  steady: { noiseFloor: -45, gainSmooth: 8, adaptivity: 0.5 },
};

const STRENGTH_TO_NR: Record<number, number> = {
  1: 14,
  2: 18,
  3: 22,
  4: 26,
  5: 30,
};

const VALID_PROFILES = new Set<DenoiseProfileId>(['crowd', 'voices', 'steady']);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeStrength(value: number): number {
  if (value <= 5) {
    return clamp(Math.round(value), 1, 5);
  }

  // Legacy saves used 40–100 percent strength.
  return clamp(Math.round(1 + ((clamp(value, 40, 100) - 40) / 60) * 4), 1, 5);
}

function parseOnOff(value: EffectParamValues[string], defaultOn = true): boolean {
  if (value === 'on' || value === true || value === 1) {
    return true;
  }

  if (value === 'off' || value === false || value === 0) {
    return false;
  }

  return defaultOn;
}

function parseDenoiseParams(params: EffectParamValues): DenoiseParams {
  const rawProfile = String(params.profile ?? 'crowd');
  const profile = VALID_PROFILES.has(rawProfile as DenoiseProfileId)
    ? (rawProfile as DenoiseProfileId)
    : 'crowd';

  return {
    strength: normalizeStrength(Number(params.strength ?? 3)),
    profile,
    reduceRumble: parseOnOff(params.reduceRumble, true),
    reduceHiss: parseOnOff(params.reduceHiss, true),
  };
}

/**
 * Denoise via FFmpeg: mono mix → optional highpass → afftdn → optional lowpass → light compression.
 *
 * @see https://ffmpeg.org/ffmpeg-filters.html#afftdn
 */
export function buildDenoiseAudioFilter(params: EffectParamValues): string {
  const denoise = parseDenoiseParams(params);
  const profile = PROFILE_SETTINGS[denoise.profile];
  const noiseReduction = STRENGTH_TO_NR[denoise.strength] ?? 22;
  const stages: string[] = [];

  stages.push('pan=mono|c0=0.5*c0+0.5*c1');

  if (denoise.reduceRumble) {
    stages.push('highpass=f=85:poles=2');
  }

  stages.push(
    `afftdn=nr=${noiseReduction}:nf=${profile.noiseFloor}:tn=1:tr=1:gs=${profile.gainSmooth}:ad=${profile.adaptivity}:rf=-42`,
  );

  if (denoise.reduceHiss) {
    stages.push('lowpass=f=12500:poles=1');
  }

  stages.push('acompressor=threshold=-22dB:ratio=2:attack=8:release=100');

  return stages.join(',');
}

export function buildEffectAudioFilter(
  effectId: AudioEffectId,
  params: EffectParamValues,
): string {
  if (effectId === 'denoise') {
    return buildDenoiseAudioFilter(params);
  }

  return STATIC_EFFECT_FILTERS[effectId];
}

export function buildEffectAudioFilterFromDefaults(effectId: AudioEffectId): string {
  return buildEffectAudioFilter(effectId, getDefaultEffectParams(effectId));
}
