export const FX_PRESETS = [
  { id: 'hard-snap', label: 'Hard Snap' },
  { id: 'natural-snap', label: 'Natural Snap' },
] as const;

/** Voloco free compressor presets. */
export const COMPRESSOR_PRESETS = [
  { id: 'rap', label: 'Rap' },
  { id: 'pop', label: 'Pop' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'parallel', label: 'Parallel' },
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
  { id: 'long-narrow', label: 'Long/Narrow' },
  { id: 'cathedral', label: 'Cathedral' },
  { id: 'medium-room', label: 'Medium Room' },
] as const;

/** Superpowered TunerScale names used in native effects JSON. Chromatic last — light correction only. */
export const AUTOTUNE_SCALES = [
  { id: 'c-major', label: 'C Major', native: 'CMAJOR' },
  { id: 'a-minor', label: 'A Minor', native: 'AMINOR' },
  { id: 'c-sharp-major', label: 'C♯ Major', native: 'CSHARPMAJOR' },
  { id: 'a-sharp-minor', label: 'A♯ Minor', native: 'ASHARPMINOR' },
  { id: 'd-major', label: 'D Major', native: 'DMAJOR' },
  { id: 'b-minor', label: 'B Minor', native: 'BMINOR' },
  { id: 'd-sharp-major', label: 'D♯ Major', native: 'DSHARPMAJOR' },
  { id: 'c-minor', label: 'C Minor', native: 'CMINOR' },
  { id: 'e-major', label: 'E Major', native: 'EMAJOR' },
  { id: 'c-sharp-minor', label: 'C♯ Minor', native: 'CSHARPMINOR' },
  { id: 'f-major', label: 'F Major', native: 'FMAJOR' },
  { id: 'd-minor', label: 'D Minor', native: 'DMINOR' },
  { id: 'f-sharp-major', label: 'F♯ Major', native: 'FSHARPMAJOR' },
  { id: 'd-sharp-minor', label: 'D♯ Minor', native: 'DSHARPMINOR' },
  { id: 'g-major', label: 'G Major', native: 'GMAJOR' },
  { id: 'e-minor', label: 'E Minor', native: 'EMINOR' },
  { id: 'g-sharp-major', label: 'G♯ Major', native: 'GSHARPMAJOR' },
  { id: 'f-minor', label: 'F Minor', native: 'FMINOR' },
  { id: 'a-major', label: 'A Major', native: 'AMAJOR' },
  { id: 'f-sharp-minor', label: 'F♯ Minor', native: 'FSHARPMINOR' },
  { id: 'a-sharp-major', label: 'A♯ Major', native: 'ASHARPMAJOR' },
  { id: 'g-minor', label: 'G Minor', native: 'GMINOR' },
  { id: 'b-major', label: 'B Major', native: 'BMAJOR' },
  { id: 'g-sharp-minor', label: 'G♯ Minor', native: 'GSHARPMINOR' },
  { id: 'chromatic', label: 'Chromatic (light correction)', native: 'CHROMATIC' },
] as const;

export const AUTOTUNE_SPEEDS = [
  { id: 'subtle', label: 'Subtle', native: 'SUBTLE' },
  { id: 'medium', label: 'Medium', native: 'MEDIUM' },
  { id: 'extreme', label: 'Extreme', native: 'EXTREME' },
] as const;

export type FxPresetId = (typeof FX_PRESETS)[number]['id'];
export type CompressorPresetId = (typeof COMPRESSOR_PRESETS)[number]['id'];
export type EqPresetId = (typeof EQ_PRESETS)[number]['id'];
export type EchoPresetId = (typeof ECHO_PRESETS)[number]['id'];
export type ReverbPresetId = (typeof REVERB_PRESETS)[number]['id'];
export type AutotuneScaleId = (typeof AUTOTUNE_SCALES)[number]['id'];
export type AutotuneSpeedId = (typeof AUTOTUNE_SPEEDS)[number]['id'];

export const AUTOTUNE_CHROMATIC_HINT =
  'Light correction only. Pick a key above for stronger snap to the scale.';

export const AUTOTUNE_SPEED_HINTS: Record<AutotuneSpeedId, string> = {
  subtle: 'Natural — gentle pitch smoothing.',
  medium: 'Standard — noticeable correction.',
  extreme: 'Hard tune — strong snap to the key.',
};

export const FX_KEY_HINT = 'Key is required for snap — pick the song key (same role as Voloco Key).';

export const FX_PRESET_HINTS: Record<FxPresetId, string> = {
  'hard-snap': 'Strong pitch-style snap (Hard Tune feel) with formant-safe shifting.',
  'natural-snap': 'Softer pitch-style smoothing with formant-safe shifting.',
};

export type AutotuneSelection = {
  scale: AutotuneScaleId;
  speed: AutotuneSpeedId;
};

/** FX owns its own Key (separate from Autotune). */
export type FxSelection = {
  preset: FxPresetId;
  scale: AutotuneScaleId;
};

export type EditChipKind =
  | 'clean-voice'
  | 'autotune'
  | 'fx'
  | 'compressor'
  | 'eq'
  | 'echo'
  | 'reverb';

/** Selected edit tools (all optional except baseline soft gate). */
export type EditChainSelection = {
  cleanVoice: boolean;
  autotune: AutotuneSelection | null;
  fx: FxSelection | null;
  compressor: CompressorPresetId | null;
  eq: EqPresetId | null;
  echo: EchoPresetId | null;
  reverb: ReverbPresetId | null;
};

/** Persisted edit recipe stored on AudioRecording (current write format). */
export type StoredEditChain = {
  version: 5;
  cleanVoice: boolean;
  autotune: AutotuneSelection | null;
  fx: FxSelection | null;
  compressor: CompressorPresetId | null;
  eq: EqPresetId | null;
  echo: EchoPresetId | null;
  reverb: ReverbPresetId | null;
};

export const EMPTY_EDIT_CHAIN: EditChainSelection = {
  cleanVoice: false,
  autotune: null,
  fx: null,
  compressor: null,
  eq: null,
  echo: null,
  reverb: null,
};

export const DEFAULT_AUTOTUNE_SELECTION: AutotuneSelection = {
  scale: 'c-major',
  speed: 'extreme',
};

export const DEFAULT_FX_SELECTION: FxSelection = {
  preset: 'hard-snap',
  scale: 'c-major',
};

export function getFxPresetLabel(preset: FxPresetId): string {
  return FX_PRESETS.find((item) => item.id === preset)?.label ?? preset;
}

export function getFxPresetHint(preset: FxPresetId): string {
  return FX_PRESET_HINTS[preset];
}

export function getAutotuneScaleLabel(scale: AutotuneScaleId): string {
  return AUTOTUNE_SCALES.find((item) => item.id === scale)?.label ?? scale;
}

export function getAutotuneSpeedLabel(speed: AutotuneSpeedId): string {
  return AUTOTUNE_SPEEDS.find((item) => item.id === speed)?.label ?? speed;
}

export function getAutotuneSpeedHint(speed: AutotuneSpeedId): string {
  return AUTOTUNE_SPEED_HINTS[speed];
}

export function getAutotuneNativeScale(scale: AutotuneScaleId): string {
  return AUTOTUNE_SCALES.find((item) => item.id === scale)?.native ?? 'CHROMATIC';
}

export function getAutotuneNativeSpeed(speed: AutotuneSpeedId): string {
  return AUTOTUNE_SPEEDS.find((item) => item.id === speed)?.native ?? 'MEDIUM';
}

export function isEditChainEmpty(selection: EditChainSelection): boolean {
  return (
    !selection.cleanVoice &&
    selection.autotune == null &&
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
  if (selection.autotune) {
    parts.push(
      `Autotune: ${getAutotuneScaleLabel(selection.autotune.scale)} · ${getAutotuneSpeedLabel(selection.autotune.speed)}`,
    );
  }
  if (selection.fx) {
    parts.push(
      `FX: ${getFxPresetLabel(selection.fx.preset)} · ${getAutotuneScaleLabel(selection.fx.scale)}`,
    );
  }
  if (selection.compressor) {
    const preset = COMPRESSOR_PRESETS.find((item) => item.id === selection.compressor);
    parts.push(`Comp: ${preset?.label ?? selection.compressor}`);
  }
  if (selection.eq) {
    const preset = EQ_PRESETS.find((item) => item.id === selection.eq);
    parts.push(`EQ: ${preset?.label ?? selection.eq}`);
  }
  if (selection.echo) {
    const preset = ECHO_PRESETS.find((item) => item.id === selection.echo);
    parts.push(`Echo: ${preset?.label ?? selection.echo}`);
  }
  if (selection.reverb) {
    const preset = REVERB_PRESETS.find((item) => item.id === selection.reverb);
    parts.push(`Reverb: ${preset?.label ?? selection.reverb}`);
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}

export function getEditChainProcessingLabel(selection: EditChainSelection): string {
  if (selection.cleanVoice && isEditChainEmpty({ ...selection, cleanVoice: false })) {
    return 'Applying Clean Voice…';
  }
  if (selection.autotune && isEditChainEmpty({ ...selection, autotune: null })) {
    return 'Applying Autotune…';
  }
  if (selection.fx && isEditChainEmpty({ ...selection, fx: null })) {
    return 'Applying FX…';
  }
  return 'Applying edit chain…';
}
