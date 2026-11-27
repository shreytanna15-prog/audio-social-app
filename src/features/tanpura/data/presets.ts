import { TANPURA_PRESET_IDS } from '../constants';
import type { TanpuraPreset, TanpuraPresetId } from '../types';

/**
 * Placeholder drone loops (C-root). Swap WAV/MP3 files in `assets/` without
 * changing this registry shape.
 */
export const TANPURA_PRESETS: TanpuraPreset[] = [
  {
    id: 'sa-pa-sa',
    label: 'Sa–Pa–Sa',
    source: require('../assets/sa-pa-sa.wav') as number,
  },
  {
    id: 'sa-ma-sa',
    label: 'Sa–Ma–Sa',
    source: require('../assets/sa-ma-sa.wav') as number,
  },
  {
    id: 'sa-only',
    label: 'Sa only',
    source: require('../assets/sa-only.wav') as number,
  },
];

const BY_ID = Object.fromEntries(
  TANPURA_PRESETS.map((preset) => [preset.id, preset]),
) as Record<TanpuraPresetId, TanpuraPreset>;

export function getTanpuraPreset(id: TanpuraPresetId): TanpuraPreset {
  return BY_ID[id] ?? BY_ID['sa-pa-sa'];
}

export function isTanpuraPresetId(value: string): value is TanpuraPresetId {
  return (TANPURA_PRESET_IDS as string[]).includes(value);
}
