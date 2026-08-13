import type {
  CompressorPresetId,
  EchoPresetId,
  EqPresetId,
  FxPresetId,
  ReverbPresetId,
} from '@/features/audio/types/edit-chips';

/** Voloco Custom Compressor controls (locked per free preset). */
export type CompTuneParams = {
  /** Dry/wet mix: 0 = dry (uncompressed), 1 = fully compressed. */
  mix: number;
  /** Pre-compressor drive (−24…+24 dB). */
  inputGainDb: number;
  /** Post-compressor make-up (−24…+24 dB). */
  outputGainDb: number;
  /** Attack in seconds (faster = more obvious compression). */
  attackSec: number;
  /** Release in seconds. */
  releaseSec: number;
  /** Compression ratio (1.5…10). */
  ratio: number;
  /** When true, threshold tracks input loudness + thresholdDiffDb. */
  autoThreshold: boolean;
  /** Manual threshold when autoThreshold is false (−40…0 dB). */
  thresholdDb: number;
  /**
   * When autoThreshold is true: effectiveThr = loudnessDb + thresholdDiffDb.
   * Lower (more negative) → more compression.
   */
  thresholdDiffDb: number;
};

/** Voloco Custom EQ controls (locked per free preset). */
export type EqTuneParams = {
  /** High-pass cutoff in Hz (rumble/low cut). */
  highPassHz: number;
  /** Parametric band gains in dB (−12…+12). */
  db200: number;
  db500: number;
  db1000: number;
  db2000: number;
  db3000: number;
  db4500: number;
  db8000: number;
  /** High-shelf gain in dB (air / brightness). */
  highShelfDb: number;
  /** Overall make-up gain after EQ (keeps cut-heavy presets from feeling quieter). */
  makeupGainDb: number;
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

/** Voloco Custom Reverb controls (locked per free preset). */
export type ReverbTuneParams = {
  /** Wet/dry mix: 0 = dry, 1 = full reverb. */
  mix: number;
  /** Stereo spread of the reverb tail (0–1). */
  width: number;
  /** High-frequency damping / shorter tail when higher (0–1). */
  damp: number;
  /** Artificial room scale (0–1). */
  roomSize: number;
  /** Time before reverb starts (0–500 ms). */
  predelayMs: number;
};

export type FxTuneSpeed = 'SUBTLE' | 'MEDIUM' | 'EXTREME';
export type FxTuneClamp = 'TIGHT' | 'LOOSE';

/** Locked recipes per FX preset. Unused fields still persist for a stable shape. */
export type FxTuneParams = {
  speed: FxTuneSpeed;
  clamp: FxTuneClamp;
  /** 0–1 wet. Tune presets mix dry+wet after Signalsmith. */
  wet: number;
  tap1Ms: number;
  tap2Ms: number;
  lfoHz: number;
  lfoDepthMs: number;
  /** Reserved (legacy robot / Bitcrusher fields). */
  carrierHz: number;
  /** Fraction of pitch error to correct (Hard/Natural). */
  strength: number;
  /** Cents slew time in ms (Natural/Clean slower; Hard ~1). */
  slewMs: number;
  /** Ignore pitch error smaller than this (vibrato keep). */
  vibratoCents: number;
  /** Reserved / Signalsmith formant (unused in v1 render). */
  formant: number;
  /** Flanger depth 0–1. */
  depth: number;
  /** Reserved (legacy Bitcrusher / robot). */
  bits: number;
  /** Reserved (legacy Bitcrusher). */
  crushHz: number;
  /** Reserved (legacy pitch shift). */
  pitchCents: number;
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

type LegacyCompParams = {
  wet?: number;
};

/** Clamp for persistence / safety when loading older saved edit chains. */
export function clampCompParams(
  params: Partial<CompTuneParams> & LegacyCompParams,
): CompTuneParams {
  const mix =
    params.mix != null
      ? params.mix
      : params.wet != null
        ? params.wet
        : 0.7;

  return {
    mix: roundToStep(clamp(mix, 0, 1), 0.01),
    inputGainDb: roundToStep(clamp(params.inputGainDb ?? 0, -24, 24), 0.1),
    outputGainDb: roundToStep(clamp(params.outputGainDb ?? 0, -24, 24), 0.1),
    attackSec: roundToStep(clamp(params.attackSec ?? 0.01, 0.001, 1), 0.001),
    releaseSec: roundToStep(clamp(params.releaseSec ?? 0.22, 0.01, 4), 0.001),
    ratio: roundToStep(clamp(params.ratio ?? 3, 1.5, 10), 0.1),
    autoThreshold: params.autoThreshold !== false,
    thresholdDb: roundToStep(clamp(params.thresholdDb ?? -16, -40, 0), 0.1),
    thresholdDiffDb: roundToStep(clamp(params.thresholdDiffDb ?? -4, -12, 12), 0.1),
  };
}

type LegacyEqParams = {
  bassDb?: number;
  mudDb?: number;
  presenceDb?: number;
  brightDb?: number;
  harshDb?: number;
};

export function clampEqParams(
  params: Partial<EqTuneParams> & LegacyEqParams,
): EqTuneParams {
  const looksLegacy =
    params.highPassHz == null &&
    params.db200 == null &&
    params.db500 == null &&
    (params.bassDb != null ||
      params.mudDb != null ||
      params.presenceDb != null ||
      params.brightDb != null ||
      params.harshDb != null);

  if (looksLegacy) {
    // Approximate old 5-knob EQ into Voloco Custom bands.
    const bass = params.bassDb ?? 0;
    const mud = params.mudDb ?? 0;
    const presence = params.presenceDb ?? 0;
    const bright = params.brightDb ?? 0;
    const harsh = params.harshDb ?? 0;
    return clampEqParams({
      highPassHz: 80,
      db200: bass * 0.6 + mud * 0.4,
      db500: mud,
      db1000: presence * 0.25,
      db2000: presence * 0.55,
      db3000: presence * 0.7,
      db4500: bright * 0.45 + harsh * 0.3,
      db8000: bright * 0.7 + harsh * 0.5,
      highShelfDb: clamp(bright * 0.35, -0.6, 6),
      makeupGainDb: 0,
    });
  }

  return {
    highPassHz: roundToStep(clamp(params.highPassHz ?? 80, 40, 1000), 1),
    db200: roundToStep(clamp(params.db200 ?? 0, -12, 12), 0.1),
    db500: roundToStep(clamp(params.db500 ?? 0, -12, 12), 0.1),
    db1000: roundToStep(clamp(params.db1000 ?? 0, -12, 12), 0.1),
    db2000: roundToStep(clamp(params.db2000 ?? 0, -12, 12), 0.1),
    db3000: roundToStep(clamp(params.db3000 ?? 0, -12, 12), 0.1),
    db4500: roundToStep(clamp(params.db4500 ?? 0, -12, 12), 0.1),
    db8000: roundToStep(clamp(params.db8000 ?? 0, -12, 12), 0.1),
    highShelfDb: roundToStep(clamp(params.highShelfDb ?? 0, -0.6, 6), 0.1),
    makeupGainDb: roundToStep(clamp(params.makeupGainDb ?? 0, 0, 6), 0.1),
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

type LegacyReverbParams = {
  sendGain?: number;
  lowCutHz?: number;
};

export function clampReverbParams(
  params: Partial<ReverbTuneParams> & LegacyReverbParams,
): ReverbTuneParams {
  const mix =
    params.mix != null
      ? params.mix
      : params.sendGain != null
        ? params.sendGain
        : 0.4;

  return {
    mix: roundToStep(clamp(mix, 0, 1), 0.01),
    width: roundToStep(clamp(params.width ?? 0.88, 0, 1), 0.01),
    damp: roundToStep(clamp(params.damp ?? 0.56, 0, 1), 0.01),
    roomSize: roundToStep(clamp(params.roomSize ?? 0.48, 0, 1), 0.01),
    predelayMs: roundToStep(clamp(params.predelayMs ?? 22, 0, 500), 1),
  };
}

export function clampFxParams(params: Partial<FxTuneParams>): FxTuneParams {
  const speed =
    params.speed === 'SUBTLE' || params.speed === 'MEDIUM' || params.speed === 'EXTREME'
      ? params.speed
      : 'SUBTLE';
  const clampMode = params.clamp === 'LOOSE' ? 'LOOSE' : 'TIGHT';
  return {
    speed,
    clamp: clampMode,
    wet: roundToStep(clamp(params.wet ?? 0.32, 0, 1), 0.01),
    tap1Ms: roundToStep(clamp(params.tap1Ms ?? 23, 10, 50), 0.5),
    tap2Ms: roundToStep(clamp(params.tap2Ms ?? 31, 10, 50), 0.5),
    lfoHz: roundToStep(clamp(params.lfoHz ?? 0.38, 0.05, 2), 0.01),
    lfoDepthMs: roundToStep(clamp(params.lfoDepthMs ?? 3.5, 0, 12), 0.1),
    carrierHz: roundToStep(clamp(params.carrierHz ?? 120, 40, 400), 1),
    strength: roundToStep(clamp(params.strength ?? 0.8, 0, 1), 0.01),
    slewMs: roundToStep(clamp(params.slewMs ?? 40, 1, 200), 1),
    vibratoCents: roundToStep(clamp(params.vibratoCents ?? 18, 0, 80), 1),
    formant: roundToStep(clamp(params.formant ?? 0.6, 0, 1), 0.01),
    depth: roundToStep(clamp(params.depth ?? 0.45, 0.1, 1), 0.01),
    bits: roundToStep(clamp(params.bits ?? 8, 2, 12), 1),
    crushHz: roundToStep(clamp(params.crushHz ?? 9500, 1000, 12000), 1),
    pitchCents: roundToStep(clamp(params.pitchCents ?? 0, -1200, 0), 1),
  };
}

/**
 * Voloco free compressor presets as locked Custom Comp recipes.
 * https://help.voloco.com/hc/en-us/articles/36347754757271-How-to-Use-the-Compressor
 *
 * Wider gaps for ear A/B, but still musical (not destroyed):
 * - Moderate: light leveling
 * - Pop: smooth polish
 * - Rap: punchy / rhythmic
 * - Parallel: strong wet + dry blend (keeps breath)
 * - Blasted: obvious squash, still listenable
 */
export function defaultCompParams(preset: CompressorPresetId): CompTuneParams {
  switch (preset) {
    case 'blasted':
      // Clear squash / loud & even — strong but not brickwalled.
      return clampCompParams({
        mix: 1,
        inputGainDb: 6,
        outputGainDb: 3.5,
        attackSec: 0.004,
        releaseSec: 0.12,
        ratio: 10,
        autoThreshold: true,
        thresholdDb: -24,
        thresholdDiffDb: -11,
      });
    case 'rap':
      // Punch + rhythm: full wet, fast attack, firm grab.
      return clampCompParams({
        mix: 1,
        inputGainDb: 4,
        outputGainDb: 3,
        attackSec: 0.005,
        releaseSec: 0.14,
        ratio: 5,
        autoThreshold: true,
        thresholdDb: -20,
        thresholdDiffDb: -8.5,
      });
    case 'pop':
      // Balanced polish: slower attack than Rap, slightly less wet.
      return clampCompParams({
        mix: 0.88,
        inputGainDb: 2,
        outputGainDb: 2.5,
        attackSec: 0.018,
        releaseSec: 0.3,
        ratio: 3,
        autoThreshold: true,
        thresholdDb: -16,
        thresholdDiffDb: -4.5,
      });
    case 'parallel':
      // Strong wet side at lower mix → punch without killing dynamics.
      return clampCompParams({
        mix: 0.38,
        inputGainDb: 5.5,
        outputGainDb: 2,
        attackSec: 0.007,
        releaseSec: 0.16,
        ratio: 5,
        autoThreshold: true,
        thresholdDb: -18,
        thresholdDiffDb: -7,
      });
    default:
      // moderate — gentle polish; clearly softer than Pop/Rap.
      return clampCompParams({
        mix: 0.32,
        inputGainDb: 0.5,
        outputGainDb: 1.5,
        attackSec: 0.028,
        releaseSec: 0.4,
        ratio: 2,
        autoThreshold: true,
        thresholdDb: -12,
        thresholdDiffDb: -1,
      });
  }
}

/**
 * Voloco free EQ presets as locked Custom EQ recipes
 * (High Pass + 200…8000 Hz bands + High Shelf + make-up gain).
 *
 * Tuned from ear A/B feedback:
 * - Scoop/Brightness felt quieter than Off → makeupGainDb
 * - Scoop mid hollow + Boost fullness need clearer contrast
 * - Brightness “sss” needed to be more obvious
 */
export function defaultEqParams(preset: EqPresetId): EqTuneParams {
  switch (preset) {
    case 'mid-range-scoop':
      // Deep mid hollow; strong ends; make-up so it doesn’t feel quieter.
      return clampEqParams({
        highPassHz: 60,
        db200: 5,
        db500: -8,
        db1000: -7.5,
        db2000: -5,
        db3000: -1.5,
        db4500: 3.5,
        db8000: 4.5,
        highShelfDb: 3.5,
        makeupGainDb: 3.5,
      });
    case 'brightness':
      // Obvious consonant sheen (sss/t); keep mids mostly full (not scooped).
      return clampEqParams({
        highPassHz: 90,
        db200: -1,
        db500: -1.5,
        db1000: 0.5,
        db2000: 1.5,
        db3000: 3.5,
        db4500: 5.5,
        db8000: 7,
        highShelfDb: 5.5,
        makeupGainDb: 2.5,
      });
    case 'low-high-boost':
      // Bigger/rounder: lift bass + treble, mids stay full (contrast to scoop).
      return clampEqParams({
        highPassHz: 50,
        db200: 5.5,
        db500: 2,
        db1000: 1,
        db2000: 0.5,
        db3000: 1,
        db4500: 3,
        db8000: 4.5,
        highShelfDb: 4,
        makeupGainDb: 1.5,
      });
    case 'telephone':
      // Kill lows/highs, leave mid band → lo-fi phone.
      return clampEqParams({
        highPassHz: 450,
        db200: -12,
        db500: -3,
        db1000: 5,
        db2000: 6,
        db3000: 4,
        db4500: -8,
        db8000: -12,
        highShelfDb: -0.6,
        makeupGainDb: 2,
      });
    default:
      // vocal-clarity — intelligibility / cut-through, not extreme sparkle.
      return clampEqParams({
        highPassHz: 85,
        db200: -2.5,
        db500: -3,
        db1000: 1,
        db2000: 3.5,
        db3000: 4.5,
        db4500: 2,
        db8000: 1,
        highShelfDb: 1.2,
        makeupGainDb: 1.5,
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

/**
 * Voloco free reverb presets as locked Custom Reverb recipes.
 * https://help.voloco.com/hc/en-us/articles/36348152679191-How-to-Add-Reverb-to-Your-Vocals
 *
 * Feel targets:
 * - Stereo Width: wide L/R space (headphones)
 * - Large Hall: big concert hall
 * - Small Club: intimate / short / tight
 * - Long and Narrow: long tail, narrow stereo (unique character)
 * - Cathedral: huge church-like bloom
 * - Medium Room: natural moderate default
 */
export function defaultReverbParams(preset: ReverbPresetId): ReverbTuneParams {
  switch (preset) {
    case 'stereo-width':
      // Wide & spacious — width is the star, room stays mid-size.
      return clampReverbParams({
        mix: 0.32,
        width: 1,
        damp: 0.48,
        roomSize: 0.48,
        predelayMs: 18,
      });
    case 'large-hall':
      // Big auditorium — large room, wide, longer ring.
      return clampReverbParams({
        mix: 0.42,
        width: 0.95,
        damp: 0.36,
        roomSize: 0.85,
        predelayMs: 32,
      });
    case 'small-club':
      // Intimate small venue — short/tight (Voloco: less reverb for rap).
      return clampReverbParams({
        mix: 0.16,
        width: 0.65,
        damp: 0.78,
        roomSize: 0.22,
        predelayMs: 8,
      });
    case 'long-narrow':
      // Elongated character — long tail + narrow stereo field.
      return clampReverbParams({
        mix: 0.38,
        width: 0.18,
        damp: 0.3,
        roomSize: 0.78,
        predelayMs: 70,
      });
    case 'cathedral':
      // Big church again (room/mix), high damp so the tail fades instead of holding a tone.
      return clampReverbParams({
        mix: 0.45,
        width: 1,
        damp: 0.62,
        roomSize: 0.95,
        predelayMs: 52,
      });
    default:
      // medium-room — natural moderate for most songs
      return clampReverbParams({
        mix: 0.26,
        width: 0.8,
        damp: 0.55,
        roomSize: 0.48,
        predelayMs: 22,
      });
  }
}

export function defaultFxParams(preset: FxPresetId): FxTuneParams {
  if (preset === 'clean') {
    return clampFxParams({
      wet: 0,
    });
  }
  if (preset === 'big-chorus') {
    return clampFxParams({
      wet: 0.7,
      depth: 0.45,
    });
  }
  if (preset === 'hard-tune') {
    return clampFxParams({
      strength: 0.92,
      slewMs: 1,
      vibratoCents: 0,
      wet: 0.85,
      formant: 0.6,
    });
  }
  if (preset === 'natural-tune') {
    return clampFxParams({
      strength: 0.68,
      slewMs: 40,
      vibratoCents: 18,
      wet: 0.75,
      formant: 0.6,
    });
  }
  return clampFxParams({ strength: 0.68, slewMs: 40, vibratoCents: 18, wet: 0.75 });
}
