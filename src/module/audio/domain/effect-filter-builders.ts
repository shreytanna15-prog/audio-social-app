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

export type EnhanceStrength = 1 | 2 | 3;

export type ReverbRoomSize = 1 | 2 | 3;

export type EchoDelay = 1 | 2 | 3;

export type ModulateSpeed = 1 | 2 | 3;

const MODULATE_TREMOLO_DEPTH = 0.45;
const MODULATE_VIBRATO_DEPTH = 0.35;

const MODULATE_SPEED_PRESETS: Record<ModulateSpeed, { tremoloHz: number; vibratoHz: number }> = {
  1: { tremoloHz: 3, vibratoHz: 2.5 },
  2: { tremoloHz: 6, vibratoHz: 5 },
  3: { tremoloHz: 10, vibratoHz: 8 },
};

const REVERB_IN_GAIN = 0.8;
const REVERB_OUT_GAIN = 0.88;

const ECHO_IN_GAIN = 0.8;
const ECHO_OUT_GAIN = 0.9;

const ECHO_DELAY_PRESETS: Record<EchoDelay, { delayMs: number; baseDecay: number }> = {
  1: { delayMs: 400, baseDecay: 0.3 },
  2: { delayMs: 750, baseDecay: 0.35 },
  3: { delayMs: 1100, baseDecay: 0.32 },
};

const REVERB_ROOM_PRESETS: Record<ReverbRoomSize, { delays: number[]; decays: number[] }> = {
  1: {
    delays: [25, 45, 70],
    decays: [0.22, 0.15, 0.1],
  },
  2: {
    delays: [40, 120, 280],
    decays: [0.4, 0.25, 0.15],
  },
  3: {
    delays: [80, 180, 350, 500],
    decays: [0.35, 0.24, 0.16, 0.1],
  },
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

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseEnhanceStrength(value: EffectParamValues[string]): EnhanceStrength {
  const numericValue = Math.round(Number(value));

  if (!Number.isFinite(numericValue)) {
    return 2;
  }

  if (numericValue <= 1) {
    return 1;
  }

  if (numericValue >= 3) {
    return 3;
  }

  return 2;
}

function parseEnhanceClarity(value: EffectParamValues[string]): number {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 50;
  }

  return clampNumber(Math.round(numericValue / 5) * 5, 0, 100);
}

function clarityPresenceGain(clarity: number): number {
  return Number(((clarity / 100) * 3).toFixed(1));
}

function parseReverbRoomSize(value: EffectParamValues[string]): ReverbRoomSize {
  const numericValue = Math.round(Number(value));

  if (!Number.isFinite(numericValue)) {
    return 2;
  }

  if (numericValue <= 1) {
    return 1;
  }

  if (numericValue >= 3) {
    return 3;
  }

  return 2;
}

function parseReverbAmount(value: EffectParamValues[string]): number {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 50;
  }

  return clampNumber(Math.round(numericValue / 5) * 5, 0, 100);
}

function formatReverbDecay(baseDecay: number, amount: number): string {
  const wet = amount / 100;
  const scaled = Math.max(0.05, baseDecay * wet);

  return scaled.toFixed(2);
}

/**
 * Short multi-tap reflections via aecho — room ambience, not long echo repeats.
 *
 * @see https://ffmpeg.org/ffmpeg-filters.html#aecho
 */
export function buildReverbAudioFilter(params: EffectParamValues): string {
  const roomSize = parseReverbRoomSize(params.roomSize ?? 2);
  const amount = parseReverbAmount(params.amount ?? 50);
  const preset = REVERB_ROOM_PRESETS[roomSize];
  const delays = preset.delays.join('|');
  const decays = preset.decays.map((baseDecay) => formatReverbDecay(baseDecay, amount)).join('|');

  return `aecho=${REVERB_IN_GAIN}:${REVERB_OUT_GAIN}:${delays}:${decays}`;
}

function parseEchoDelay(value: EffectParamValues[string]): EchoDelay {
  const numericValue = Math.round(Number(value));

  if (!Number.isFinite(numericValue)) {
    return 2;
  }

  if (numericValue <= 1) {
    return 1;
  }

  if (numericValue >= 3) {
    return 3;
  }

  return 2;
}

function parseEchoIntensity(value: EffectParamValues[string]): number {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 50;
  }

  return clampNumber(Math.round(numericValue / 5) * 5, 0, 100);
}

/**
 * Long single-tap delay via aecho — audible repeats, not short room reflections.
 *
 * @see https://ffmpeg.org/ffmpeg-filters.html#aecho
 */
export function buildEchoAudioFilter(params: EffectParamValues): string {
  const delay = parseEchoDelay(params.delay ?? 2);
  const intensity = parseEchoIntensity(params.intensity ?? 50);
  const preset = ECHO_DELAY_PRESETS[delay];
  const decay = formatReverbDecay(preset.baseDecay, intensity);

  return `aecho=${ECHO_IN_GAIN}:${ECHO_OUT_GAIN}:${preset.delayMs}:${decay}`;
}

function parseModulateSpeed(value: EffectParamValues[string]): ModulateSpeed {
  const numericValue = Math.round(Number(value));

  if (!Number.isFinite(numericValue)) {
    return 2;
  }

  if (numericValue <= 1) {
    return 1;
  }

  if (numericValue >= 3) {
    return 3;
  }

  return 2;
}

/**
 * Rhythmic volume + pitch wobble via tremolo then vibrato.
 *
 * @see https://ffmpeg.org/ffmpeg-filters.html#tremolo
 * @see https://ffmpeg.org/ffmpeg-filters.html#vibrato
 */
export function buildModulateAudioFilter(params: EffectParamValues): string {
  const speed = parseModulateSpeed(params.speed ?? 2);
  const preset = MODULATE_SPEED_PRESETS[speed];

  return [
    `tremolo=f=${preset.tremoloHz}:d=${MODULATE_TREMOLO_DEPTH}`,
    `vibrato=f=${preset.vibratoHz}:d=${MODULATE_VIBRATO_DEPTH}`,
  ].join(',');
}

/**
 * Additive vocal polish on top of the default optimize baseline.
 * Avoids repeating loudnorm/compressor from auto-optimize — uses speechnorm, parallel
 * compression, and presence EQ instead.
 *
 * @see https://ffmpeg.org/ffmpeg-filters.html#speechnorm
 * @see https://ffmpeg.org/ffmpeg-filters.html#acompressor
 */
export function buildEnhanceAudioFilter(params: EffectParamValues): string {
  const strength = parseEnhanceStrength(params.strength ?? 2);
  const clarity = parseEnhanceClarity(params.clarity ?? 50);
  const presenceGain = clarityPresenceGain(clarity);
  const stages: string[] = [];

  if (strength === 1) {
    stages.push('acompressor=threshold=-20dB:ratio=2:attack=5:release=80:mix=0.35');
  } else if (strength === 2) {
    stages.push('speechnorm=e=6.25:r=0.00001:l=1');
  } else {
    stages.push('speechnorm=e=12.5:r=0.0001:l=1');
    stages.push('equalizer=f=5500:width_type=o:gain=-2');
  }

  if (presenceGain > 0) {
    stages.push(`equalizer=f=3400:width_type=o:gain=${presenceGain}`);
  }

  return stages.join(',');
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

  if (effectId === 'enhance') {
    return buildEnhanceAudioFilter(params);
  }

  if (effectId === 'reverb') {
    return buildReverbAudioFilter(params);
  }

  if (effectId === 'echo') {
    return buildEchoAudioFilter(params);
  }

  if (effectId === 'modulate') {
    return buildModulateAudioFilter(params);
  }

  throw new Error(`Unknown audio effect: ${effectId}`);
}

export function buildEffectAudioFilterFromDefaults(effectId: AudioEffectId): string {
  return buildEffectAudioFilter(effectId, getDefaultEffectParams(effectId));
}
