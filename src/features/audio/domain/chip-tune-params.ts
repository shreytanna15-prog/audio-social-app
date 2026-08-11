import type {
  CompressorPresetId,
  EchoPresetId,
  EqPresetId,
  FxPresetId,
  ReverbPresetId,
} from '@/features/audio/types/edit-chips';

export type CompTuneParams = {
  thresholdDb: number;
  ratio: number;
  wet: number;
  outputGainDb: number;
  attackSec: number;
};

export type EqTuneParams = {
  bassDb: number;
  mudDb: number;
  presenceDb: number;
  brightDb: number;
  harshDb: number;
};

/** Voloco Custom Echo controls (locked per free preset). */
export type EchoTuneParams = {
  /** 0–1: duck wet trail under dry vocal (sidechain-style). */
  duckDelay: number;
  /** When true, left/right delay are beat divisions; when false, milliseconds. */
  tempoSync: boolean;
  /** Left delay: beats (tempoSync) or ms (!tempoSync). */
  leftDelay: number;
  /** Right delay: beats or ms. */
  rightDelay: number;
  /** 0–1 left feedback (more = longer repeats). */
  leftFeedback: number;
  /** 0–1 right feedback. */
  rightFeedback: number;
  /** 0–1 cross-feed L↔R (ping-pong). */
  xoverFeedback: number;
  /** 0–1 dry vocal level. */
  dryLevel: number;
  /** 0–1 wet echo level. */
  wetLevel: number;
};

export type ReverbTuneParams = {
  sendGain: number;
  roomSize: number;
  damp: number;
  width: number;
  predelayMs: number;
  lowCutHz: number;
};

export type FxTuneSpeed = 'SUBTLE' | 'MEDIUM' | 'EXTREME';
export type FxTuneClamp = 'TIGHT' | 'LOOSE';

export type FxTuneParams = {
  speed: FxTuneSpeed;
  clamp: FxTuneClamp;
};

function clamp(value: number, min: number, max: number): number {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

function roundToStep(value: number, step: number): number {
  if (step <= 0) {
    return value;
  }
  const rounded = Math.round(value / step) * step;
  const decimals = String(step).includes('.')
    ? (String(step).split('.')[1]?.length ?? 0)
    : 0;
  return Number(rounded.toFixed(decimals));
}

/** Clamp for persistence / safety when loading older saved edit chains. */
export function clampCompParams(params: Partial<CompTuneParams>): CompTuneParams {
  return {
    thresholdDb: roundToStep(clamp(params.thresholdDb ?? -14, -28, -6), 0.5),
    ratio: roundToStep(clamp(params.ratio ?? 2, 1.5, 10), 0.1),
    wet: roundToStep(clamp(params.wet ?? 0.55, 0, 1), 0.01),
    outputGainDb: roundToStep(clamp(params.outputGainDb ?? 0.8, 0, 4), 0.1),
    attackSec: roundToStep(clamp(params.attackSec ?? 0.01, 0.003, 0.04), 0.001),
  };
}

export function clampEqParams(params: Partial<EqTuneParams>): EqTuneParams {
  return {
    bassDb: roundToStep(clamp(params.bassDb ?? 0, -9, 9), 0.5),
    mudDb: roundToStep(clamp(params.mudDb ?? -3.5, -9, 0), 0.5),
    presenceDb: roundToStep(clamp(params.presenceDb ?? 3.2, -4, 8), 0.5),
    brightDb: roundToStep(clamp(params.brightDb ?? 1.2, -6, 6), 0.5),
    harshDb: roundToStep(clamp(params.harshDb ?? -1.5, -6, 0), 0.5),
  };
}

type LegacyEchoParams = {
  sendGain?: number;
  beats?: number;
  decay?: number;
  tone?: number;
};

export function clampEchoParams(
  params: Partial<EchoTuneParams> & LegacyEchoParams,
): EchoTuneParams {
  // Migrate older sendGain/beats/decay recipes into Voloco-style controls.
  const looksLegacy =
    params.leftDelay == null &&
    params.wetLevel == null &&
    (params.beats != null || params.sendGain != null || params.decay != null);

  if (looksLegacy) {
    const beats = params.beats ?? 0.5;
    const decay = params.decay ?? 0.35;
    const wet = params.sendGain ?? 0.5;
    return clampEchoParams({
      duckDelay: 0.35,
      tempoSync: true,
      leftDelay: beats,
      rightDelay: beats,
      leftFeedback: decay,
      rightFeedback: decay,
      xoverFeedback: 0,
      dryLevel: 1,
      wetLevel: wet,
    });
  }

  const tempoSync = params.tempoSync !== false;
  return {
    duckDelay: roundToStep(clamp(params.duckDelay ?? 0.35, 0, 1), 0.01),
    tempoSync,
    leftDelay: roundToStep(
      clamp(params.leftDelay ?? 0.5, tempoSync ? 0.03125 : 1, tempoSync ? 2 : 2000),
      tempoSync ? 0.001 : 1,
    ),
    rightDelay: roundToStep(
      clamp(params.rightDelay ?? 0.5, tempoSync ? 0.03125 : 1, tempoSync ? 2 : 2000),
      tempoSync ? 0.001 : 1,
    ),
    leftFeedback: roundToStep(clamp(params.leftFeedback ?? 0.35, 0, 0.95), 0.01),
    rightFeedback: roundToStep(clamp(params.rightFeedback ?? 0.35, 0, 0.95), 0.01),
    xoverFeedback: roundToStep(clamp(params.xoverFeedback ?? 0, 0, 0.95), 0.01),
    dryLevel: roundToStep(clamp(params.dryLevel ?? 1, 0, 1), 0.01),
    wetLevel: roundToStep(clamp(params.wetLevel ?? 0.5, 0, 1), 0.01),
  };
}

export function clampReverbParams(params: Partial<ReverbTuneParams>): ReverbTuneParams {
  return {
    sendGain: roundToStep(clamp(params.sendGain ?? 0.4, 0, 0.95), 0.01),
    roomSize: roundToStep(clamp(params.roomSize ?? 0.48, 0.15, 0.95), 0.01),
    damp: roundToStep(clamp(params.damp ?? 0.56, 0.15, 0.9), 0.01),
    width: roundToStep(clamp(params.width ?? 0.88, 0.25, 1), 0.01),
    predelayMs: roundToStep(clamp(params.predelayMs ?? 22, 0, 80), 1),
    lowCutHz: roundToStep(clamp(params.lowCutHz ?? 260, 120, 400), 5),
  };
}

export function clampFxParams(params: Partial<FxTuneParams>): FxTuneParams {
  const speed =
    params.speed === 'SUBTLE' || params.speed === 'MEDIUM' || params.speed === 'EXTREME'
      ? params.speed
      : 'MEDIUM';
  const clampMode = params.clamp === 'LOOSE' ? 'LOOSE' : 'TIGHT';
  return { speed, clamp: clampMode };
}

/** Voloco-style free compressor presets — fixed character values. */
export function defaultCompParams(preset: CompressorPresetId): CompTuneParams {
  switch (preset) {
    case 'blasted':
      return clampCompParams({
        thresholdDb: -24,
        ratio: 8,
        wet: 1,
        outputGainDb: 2.2,
        attackSec: 0.006,
      });
    case 'rap':
      return clampCompParams({
        thresholdDb: -20,
        ratio: 4.5,
        wet: 1,
        outputGainDb: 1.6,
        attackSec: 0.008,
      });
    case 'pop':
      return clampCompParams({
        thresholdDb: -18,
        ratio: 4,
        wet: 0.9,
        outputGainDb: 1.5,
        attackSec: 0.01,
      });
    case 'parallel':
      return clampCompParams({
        thresholdDb: -16,
        ratio: 3.5,
        wet: 0.45,
        outputGainDb: 1.2,
        attackSec: 0.01,
      });
    default:
      // moderate — light polish
      return clampCompParams({
        thresholdDb: -12,
        ratio: 2,
        wet: 0.5,
        outputGainDb: 0.8,
        attackSec: 0.012,
      });
  }
}

/** Voloco-style free EQ presets — fixed character values. */
export function defaultEqParams(preset: EqPresetId): EqTuneParams {
  switch (preset) {
    case 'mid-range-scoop':
      return clampEqParams({
        bassDb: 3.5,
        mudDb: -6.5,
        presenceDb: 0.5,
        brightDb: 3.5,
        harshDb: -0.5,
      });
    case 'brightness':
      return clampEqParams({
        bassDb: -1,
        mudDb: -1,
        presenceDb: 4.5,
        brightDb: 5,
        harshDb: -2,
      });
    case 'low-high-boost':
      return clampEqParams({
        bassDb: 5,
        mudDb: -2.5,
        presenceDb: 0.5,
        brightDb: 4.5,
        harshDb: 0,
      });
    case 'telephone':
      // Unmistakable lo-fi phone tone
      return clampEqParams({
        bassDb: -9,
        mudDb: -2,
        presenceDb: 6.5,
        brightDb: -6,
        harshDb: -1,
      });
    default:
      // vocal-clarity
      return clampEqParams({
        bassDb: 0.5,
        mudDb: -4.5,
        presenceDb: 5,
        brightDb: 2.5,
        harshDb: -2.5,
      });
  }
}

/**
 * Voloco free echo presets as locked Custom Echo recipes.
 * Delays are in beats (tempoSync=true, project tempo assumed 120 BPM offline).
 *
 * Recipes target Voloco docs feel:
 * - Resonant Buzz: really fast slapback
 * - 8th Note Bounce: rhythmic 8th on the beat
 * - Slinky: longer spacious trail
 * - Right to Left: stereo ping-pong L↔R
 * - Coin Drop: fast, louder / more present
 */
export function defaultEchoParams(preset: EchoPresetId): EchoTuneParams {
  switch (preset) {
    case 'resonant-buzz':
      return clampEchoParams({
        duckDelay: 0.2,
        tempoSync: true,
        leftDelay: 0.125,
        rightDelay: 0.125,
        leftFeedback: 0.1,
        rightFeedback: 0.1,
        xoverFeedback: 0,
        dryLevel: 1,
        wetLevel: 0.45,
      });
    case 'eighth-note-bounce':
      return clampEchoParams({
        duckDelay: 0.4,
        tempoSync: true,
        leftDelay: 0.5,
        rightDelay: 0.5,
        leftFeedback: 0.3,
        rightFeedback: 0.3,
        xoverFeedback: 0.1,
        dryLevel: 1,
        wetLevel: 0.5,
      });
    case 'slinky':
      return clampEchoParams({
        duckDelay: 0.25,
        tempoSync: true,
        leftDelay: 0.75,
        rightDelay: 0.75,
        leftFeedback: 0.6,
        rightFeedback: 0.6,
        xoverFeedback: 0.15,
        dryLevel: 1,
        wetLevel: 0.55,
      });
    case 'right-to-left':
      return clampEchoParams({
        duckDelay: 0.35,
        tempoSync: true,
        leftDelay: 0.5,
        rightDelay: 0.75,
        leftFeedback: 0.22,
        rightFeedback: 0.22,
        xoverFeedback: 0.55,
        dryLevel: 1,
        wetLevel: 0.5,
      });
    default:
      // coin-drop
      return clampEchoParams({
        duckDelay: 0.2,
        tempoSync: true,
        leftDelay: 0.25,
        rightDelay: 0.28,
        leftFeedback: 0.35,
        rightFeedback: 0.35,
        xoverFeedback: 0.3,
        dryLevel: 1,
        wetLevel: 0.65,
      });
  }
}

/** Voloco-style free reverb presets — dry vs hall must be obvious. */
export function defaultReverbParams(preset: ReverbPresetId): ReverbTuneParams {
  switch (preset) {
    case 'cathedral':
      return clampReverbParams({
        sendGain: 0.72,
        roomSize: 0.92,
        damp: 0.38,
        width: 1,
        predelayMs: 42,
        lowCutHz: 180,
      });
    case 'large-hall':
      return clampReverbParams({
        sendGain: 0.64,
        roomSize: 0.82,
        damp: 0.42,
        width: 1,
        predelayMs: 32,
        lowCutHz: 200,
      });
    case 'stereo-width':
      return clampReverbParams({
        sendGain: 0.5,
        roomSize: 0.52,
        damp: 0.4,
        width: 1,
        predelayMs: 18,
        lowCutHz: 230,
      });
    case 'long-narrow':
      return clampReverbParams({
        sendGain: 0.58,
        roomSize: 0.7,
        damp: 0.58,
        width: 0.35,
        predelayMs: 48,
        lowCutHz: 270,
      });
    case 'small-club':
      return clampReverbParams({
        sendGain: 0.38,
        roomSize: 0.28,
        damp: 0.6,
        width: 0.75,
        predelayMs: 10,
        lowCutHz: 260,
      });
    default:
      // medium-room
      return clampReverbParams({
        sendGain: 0.48,
        roomSize: 0.5,
        damp: 0.52,
        width: 0.9,
        predelayMs: 22,
        lowCutHz: 250,
      });
  }
}

export function defaultFxParams(preset: FxPresetId): FxTuneParams {
  if (preset === 'natural-snap') {
    return clampFxParams({ speed: 'SUBTLE', clamp: 'TIGHT' });
  }
  // hard-snap
  return clampFxParams({ speed: 'MEDIUM', clamp: 'TIGHT' });
}
