export const PUNCH_IN_SILENCE_EPSILON = 0.0005;

export type PunchInSegment =
  | { kind: 'silence'; durationSeconds: number }
  | { kind: 'old'; startSeconds: number; endSeconds: number }
  | { kind: 'new' };

/**
 * Pieces of a flattened punch-in stem from 0. Does not keep old audio after
 * the new take (playhead onward is the new recording).
 */
export function punchInSegments(input: {
  oldStartSeconds: number;
  oldDurationSeconds: number;
  originSeconds: number;
}): PunchInSegment[] {
  const oldStart = Math.max(0, input.oldStartSeconds);
  const oldDuration = Math.max(0, input.oldDurationSeconds);
  const oldEnd = oldStart + oldDuration;
  const origin = Math.max(0, input.originSeconds);
  const segments: PunchInSegment[] = [];

  if (origin > PUNCH_IN_SILENCE_EPSILON) {
    if (oldStart + PUNCH_IN_SILENCE_EPSILON >= origin) {
      segments.push({ kind: 'silence', durationSeconds: origin });
    } else {
      if (oldStart > PUNCH_IN_SILENCE_EPSILON) {
        segments.push({ kind: 'silence', durationSeconds: oldStart });
      }

      const keepEnd = Math.min(oldDuration, origin - oldStart);
      if (keepEnd > PUNCH_IN_SILENCE_EPSILON) {
        segments.push({ kind: 'old', startSeconds: 0, endSeconds: keepEnd });
      }

      const gap = origin - oldEnd;
      if (gap > PUNCH_IN_SILENCE_EPSILON) {
        segments.push({ kind: 'silence', durationSeconds: gap });
      }
    }
  }

  segments.push({ kind: 'new' });
  return segments;
}

export function punchInOutputDurationSeconds(
  originSeconds: number,
  takeDurationSeconds: number,
): number {
  return Math.max(0, originSeconds) + Math.max(0, takeDurationSeconds);
}

export function punchInNeedsFfmpeg(segments: PunchInSegment[]): boolean {
  return segments.some((segment) => segment.kind !== 'new');
}
