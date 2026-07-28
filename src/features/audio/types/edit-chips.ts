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

export type CompressorPresetId = (typeof COMPRESSOR_PRESETS)[number]['id'];
export type EqPresetId = (typeof EQ_PRESETS)[number]['id'];
export type EchoPresetId = (typeof ECHO_PRESETS)[number]['id'];
export type ReverbPresetId = (typeof REVERB_PRESETS)[number]['id'];

export type EditChipKind = 'clean-voice' | 'compressor' | 'eq' | 'echo' | 'reverb';

/** Selected Voloco Free–tier edit tools (all optional except baseline soft gate). */
export type EditChainSelection = {
  cleanVoice: boolean;
  compressor: CompressorPresetId | null;
  eq: EqPresetId | null;
  echo: EchoPresetId | null;
  reverb: ReverbPresetId | null;
};

export const EMPTY_EDIT_CHAIN: EditChainSelection = {
  cleanVoice: false,
  compressor: null,
  eq: null,
  echo: null,
  reverb: null,
};

export function isEditChainEmpty(selection: EditChainSelection): boolean {
  return (
    !selection.cleanVoice &&
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
  return 'Applying edit chain…';
}
