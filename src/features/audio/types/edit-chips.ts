import type {
  CompTuneParams,
  EchoTuneParams,
  EqTuneParams,
  FxTuneParams,
  ReverbTuneParams,
} from '@/features/audio/domain/chip-tune-params';
import {
  defaultCompParams,
  defaultEchoParams,
  defaultEqParams,
  defaultFxParams,
  defaultReverbParams,
} from '@/features/audio/domain/chip-tune-params';

export const FX_PRESETS = [
  { id: 'hard-tune', label: 'Hard Tune' },
  { id: 'natural-tune', label: 'Natural Tune' },
  { id: 'clean', label: 'Clean' },
  { id: 'big-chorus', label: 'Big Chorus' },
] as const;

/** Voloco free compressor presets. */
export const COMPRESSOR_PRESETS = [
  { id: 'rap', label: 'Rap' },
  { id: 'pop', label: 'Pop' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'parallel', label: 'Parallel Compression' },
  { id: 'blasted', label: 'Blasted' },
] as const;

/** Voloco free EQ presets. */
export const EQ_PRESETS = [
  { id: 'mid-range-scoop', label: 'Mid-range Scoop' },
  { id: 'brightness', label: 'Brightness' },
  { id: 'low-high-boost', label: 'Low/High Boost' },
  { id: 'vocal-clarity', label: 'Vocal Clarity' },
  { id: 'telephone', label: 'Telephone' },
] as const;

/** Voloco free echo presets. */
export const ECHO_PRESETS = [
  { id: 'right-to-left', label: 'Right to Left' },
  { id: 'eighth-note-bounce', label: '8th Note Bounce' },
  { id: 'resonant-buzz', label: 'Resonant Buzz' },
  { id: 'slinky', label: 'Slinky' },
  { id: 'coin-drop', label: 'Coin Drop' },
] as const;

/** Voloco free reverb presets. */
export const REVERB_PRESETS = [
  { id: 'stereo-width', label: 'Stereo Width' },
  { id: 'large-hall', label: 'Large Hall' },
  { id: 'small-club', label: 'Small Club' },
  { id: 'long-narrow', label: 'Long and Narrow' },
  { id: 'cathedral', label: 'Cathedral' },
  { id: 'medium-room', label: 'Medium Room' },
] as const;

/**
 * Pitch scale ids kept for FX persistence compatibility (always chromatic in UI).
 * Not an Autotune chip — that chip was removed.
 */
export const FX_SCALES = [
  { id: 'chromatic', label: 'Chromatic', native: 'CHROMATIC' },
] as const;

export type FxPresetId = (typeof FX_PRESETS)[number]['id'];
export type CompressorPresetId = (typeof COMPRESSOR_PRESETS)[number]['id'];
export type EqPresetId = (typeof EQ_PRESETS)[number]['id'];
export type EchoPresetId = (typeof ECHO_PRESETS)[number]['id'];
export type ReverbPresetId = (typeof REVERB_PRESETS)[number]['id'];
export type FxScaleId = (typeof FX_SCALES)[number]['id'];

export const FX_PRESET_HINTS: Record<FxPresetId, string> = {
  'hard-tune': 'Snaps toward the nearest note. Your melody stays.',
  'natural-tune': 'Gently pulls toward the nearest note. Vibrato mostly stays.',
  clean: 'Your voice as recorded, no pitch style. Instant.',
  'big-chorus': 'Wider, thicker voice. Not echo repeats.',
};

/** Native pitch/style FX that actually process audio (Clean is UI-only / pass-through). */
export function isNativeFxPreset(preset: FxPresetId): boolean {
  return (
    preset === 'big-chorus' ||
    preset === 'hard-tune' ||
    preset === 'natural-tune'
  );
}

/** Scale is always chromatic (no Key UI). Kept for persistence compatibility. */
export type FxSelection = {
  preset: FxPresetId;
  scale: FxScaleId;
  params: FxTuneParams;
};

export type CompressorSelection = {
  preset: CompressorPresetId;
  params: CompTuneParams;
};

export type EqSelection = {
  preset: EqPresetId;
  params: EqTuneParams;
};

export type EchoSelection = {
  preset: EchoPresetId;
  params: EchoTuneParams;
};

export type ReverbSelection = {
  preset: ReverbPresetId;
  params: ReverbTuneParams;
};

export type EditChipKind =
  | 'clean-voice'
  | 'fx'
  | 'compressor'
  | 'eq'
  | 'echo'
  | 'reverb';

/** Selected edit tools (all optional except baseline soft gate). */
export type EditChainSelection = {
  cleanVoice: boolean;
  fx: FxSelection | null;
  compressor: CompressorSelection | null;
  eq: EqSelection | null;
  echo: EchoSelection | null;
  reverb: ReverbSelection | null;
};

/** Persisted edit recipe stored on AudioRecording (current write format). */
export type StoredEditChain = {
  version: 7;
  cleanVoice: boolean;
  fx: FxSelection | null;
  compressor: CompressorSelection | null;
  eq: EqSelection | null;
  echo: EchoSelection | null;
  reverb: ReverbSelection | null;
};

export const EMPTY_EDIT_CHAIN: EditChainSelection = {
  cleanVoice: false,
  fx: null,
  compressor: null,
  eq: null,
  echo: null,
  reverb: null,
};

export const DEFAULT_FX_SELECTION: FxSelection = {
  preset: 'hard-tune',
  scale: 'chromatic',
  params: defaultFxParams('hard-tune'),
};

export function createCompressorSelection(preset: CompressorPresetId): CompressorSelection {
  return { preset, params: defaultCompParams(preset) };
}

export function createEqSelection(preset: EqPresetId): EqSelection {
  return { preset, params: defaultEqParams(preset) };
}

export function createEchoSelection(preset: EchoPresetId): EchoSelection {
  return { preset, params: defaultEchoParams(preset) };
}

export function createReverbSelection(preset: ReverbPresetId): ReverbSelection {
  return { preset, params: defaultReverbParams(preset) };
}

export function createFxSelection(preset: FxPresetId, scale: FxScaleId = 'chromatic'): FxSelection {
  return { preset, scale, params: defaultFxParams(preset) };
}

export function getFxPresetLabel(preset: FxPresetId): string {
  return FX_PRESETS.find((item) => item.id === preset)?.label ?? preset;
}

export function getFxPresetHint(preset: FxPresetId): string {
  return FX_PRESET_HINTS[preset];
}

export function isEditChainEmpty(selection: EditChainSelection): boolean {
  return (
    !selection.cleanVoice &&
    selection.fx == null &&
    selection.compressor == null &&
    selection.eq == null &&
    selection.echo == null &&
    selection.reverb == null
  );
}

export function getEditChainLabel(selection: EditChainSelection): string | null {
  const parts: string[] = [];

  if (selection.cleanVoice) {
    parts.push('Clean Voice');
  }
  if (selection.fx) {
    parts.push(`FX: ${getFxPresetLabel(selection.fx.preset)}`);
  }
  if (selection.compressor) {
    const preset = COMPRESSOR_PRESETS.find((item) => item.id === selection.compressor?.preset);
    parts.push(`Comp: ${preset?.label ?? selection.compressor.preset}`);
  }
  if (selection.eq) {
    const preset = EQ_PRESETS.find((item) => item.id === selection.eq?.preset);
    parts.push(`EQ: ${preset?.label ?? selection.eq.preset}`);
  }
  if (selection.echo) {
    const preset = ECHO_PRESETS.find((item) => item.id === selection.echo?.preset);
    parts.push(`Echo: ${preset?.label ?? selection.echo.preset}`);
  }
  if (selection.reverb) {
    const preset = REVERB_PRESETS.find((item) => item.id === selection.reverb?.preset);
    parts.push(`Reverb: ${preset?.label ?? selection.reverb.preset}`);
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}

export function getEditChainProcessingLabel(selection: EditChainSelection): string {
  if (selection.cleanVoice && isEditChainEmpty({ ...selection, cleanVoice: false })) {
    return 'Applying Clean Voice…';
  }
  if (selection.fx && isEditChainEmpty({ ...selection, fx: null })) {
    return 'Applying FX…';
  }
  return 'Applying edit chain…';
}
