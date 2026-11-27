import {
  TANPURA_INDIAN_PITCH_LABELS,
  TANPURA_PITCH_IDS,
  TANPURA_PLAYBACK_RATE_MAX,
  TANPURA_PLAYBACK_RATE_MIN,
  TANPURA_REFERENCE_PITCH,
} from '../constants';
import type { TanpuraLabelMode, TanpuraPitchId } from '../types';

const SEMITONE_INDEX: Record<TanpuraPitchId, number> = {
  C: 0,
  'C#': 1,
  D: 2,
  'D#': 3,
  E: 4,
  F: 5,
  'F#': 6,
  G: 7,
  'G#': 8,
  A: 9,
  'A#': 10,
  B: 11,
};

/** Chromatic playbackRate relative to the bundled loop's reference Sa. */
export function playbackRateForPitch(pitchId: TanpuraPitchId): number {
  const delta =
    SEMITONE_INDEX[pitchId] - SEMITONE_INDEX[TANPURA_REFERENCE_PITCH];
  return Math.pow(2, delta / 12);
}

export function combinedPlaybackRate(
  pitchId: TanpuraPitchId,
  speed: number,
  fineSemis: number,
): number {
  const rate =
    playbackRateForPitch(pitchId) *
    speed *
    Math.pow(2, fineSemis / 12);
  return Math.min(
    TANPURA_PLAYBACK_RATE_MAX,
    Math.max(TANPURA_PLAYBACK_RATE_MIN, rate),
  );
}

export function labelForPitch(
  pitchId: TanpuraPitchId,
  mode: TanpuraLabelMode,
): string {
  if (mode === 'indian') {
    return TANPURA_INDIAN_PITCH_LABELS[pitchId];
  }
  return pitchId;
}

export function isTanpuraPitchId(value: string): value is TanpuraPitchId {
  return (TANPURA_PITCH_IDS as string[]).includes(value);
}

export function isTanpuraLabelMode(value: string): value is TanpuraLabelMode {
  return value === 'western' || value === 'indian';
}
