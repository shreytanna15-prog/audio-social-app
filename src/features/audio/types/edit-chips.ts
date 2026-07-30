export const COMPRESSOR_PRESETS = [
  { id: 'gentle', label: 'Gentle' },
  { id: 'pop', label: 'Pop' },
  { id: 'punch', label: 'Punch' },
] as const;

export const EQ_PRESETS = [
  { id: 'warm-bass', label: 'Warm Bass' },
  { id: 'clear-notes', label: 'Clear Notes' },
  { id: 'bright', label: 'Bright' },
  { id: 'vocal-presence', label: 'Vocal Presence' },
] as const;

export const ECHO_PRESETS = [
  { id: 'slapback', label: 'Slapback' },
  { id: 'classic', label: 'Classic' },
  { id: 'bounce', label: 'Bounce' },
] as const;

export const REVERB_PRESETS = [
  { id: 'room', label: 'Room' },
  { id: 'hall', label: 'Hall' },
  { id: 'soft-plate', label: 'Soft Plate' },
] as const;

/** Superpowered TunerScale names used in native effects JSON. */
export const AUTOTUNE_SCALES = [
  { id: 'chromatic', label: 'Chromatic', native: 'CHROMATIC' },
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
] as const;

export const AUTOTUNE_SPEEDS = [
  { id: 'subtle', label: 'Subtle', native: 'SUBTLE' },
  { id: 'medium', label: 'Medium', native: 'MEDIUM' },
  { id: 'extreme', label: 'Extreme', native: 'EXTREME' },
] as const;

export type CompressorPresetId = (typeof COMPRESSOR_PRESETS)[number]['id'];
export type EqPresetId = (typeof EQ_PRESETS)[number]['id'];
export type EchoPresetId = (typeof ECHO_PRESETS)[number]['id'];
export type ReverbPresetId = (typeof REVERB_PRESETS)[number]['id'];
export type AutotuneScaleId = (typeof AUTOTUNE_SCALES)[number]['id'];
export type AutotuneSpeedId = (typeof AUTOTUNE_SPEEDS)[number]['id'];

export type AutotuneSelection = {
  scale: AutotuneScaleId;
  speed: AutotuneSpeedId;
};

export type EditChipKind =
  | 'clean-voice'
  | 'autotune'
  | 'compressor'
  | 'eq'
  | 'echo'
  | 'reverb';

/** Selected Voloco Free–tier edit tools (all optional except baseline soft gate). */
export type EditChainSelection = {
  cleanVoice: boolean;
  autotune: AutotuneSelection | null;
  compressor: CompressorPresetId | null;
  eq: EqPresetId | null;
  echo: EchoPresetId | null;
  reverb: ReverbPresetId | null;
};

export const EMPTY_EDIT_CHAIN: EditChainSelection = {
  cleanVoice: false,
  autotune: null,
  compressor: null,
  eq: null,
  echo: null,
  reverb: null,
};

export const DEFAULT_AUTOTUNE_SELECTION: AutotuneSelection = {
  scale: 'chromatic',
  speed: 'medium',
};

export function getAutotuneScaleLabel(scale: AutotuneScaleId): string {
  return AUTOTUNE_SCALES.find((item) => item.id === scale)?.label ?? scale;
}

export function getAutotuneSpeedLabel(speed: AutotuneSpeedId): string {
  return AUTOTUNE_SPEEDS.find((item) => item.id === speed)?.label ?? speed;
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
  return 'Applying edit chain…';
}
