export const PUNCH_IN_SILENCE_EPSILON = 0.0005;

export type PunchInSegment =
  | { kind: 'silence'; durationSeconds: number }
  | { kind: 'old'; startSeconds: number; endSeconds: number }
  | { kind: 'new' };

/**
 * Flattened punch-in stem from 0: keep old before the pole, insert the new
 * take, then keep old audio after the take ends (Voloco-style splice).
 */
export function punchInSegments(input: {
  oldStartSeconds: number;
  oldDurationSeconds: number;
  originSeconds: number;
  takeDurationSeconds: number;
}): PunchInSegment[] {
  const oldStart = Math.max(0, input.oldStartSeconds);
  const oldDuration = Math.max(0, input.oldDurationSeconds);
  const oldEnd = oldStart + oldDuration;
  const origin = Math.max(0, input.originSeconds);
  const takeDuration = Math.max(0, input.takeDurationSeconds);
  const punchEnd = origin + takeDuration;
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

  if (oldEnd > punchEnd + PUNCH_IN_SILENCE_EPSILON) {
    const gapAfter = oldStart - punchEnd;
    if (gapAfter > PUNCH_IN_SILENCE_EPSILON) {
      segments.push({ kind: 'silence', durationSeconds: gapAfter });
      segments.push({ kind: 'old', startSeconds: 0, endSeconds: oldDuration });
    } else {
      const tailStartInFile = Math.max(0, punchEnd - oldStart);
      if (oldDuration - tailStartInFile > PUNCH_IN_SILENCE_EPSILON) {
        segments.push({
          kind: 'old',
          startSeconds: tailStartInFile,
          endSeconds: oldDuration,
        });
      }
    }
  }

  return segments;
}

export function punchInOutputDurationSeconds(input: {
  oldStartSeconds: number;
  oldDurationSeconds: number;
  originSeconds: number;
  takeDurationSeconds: number;
}): number {
  const oldEnd = Math.max(0, input.oldStartSeconds) + Math.max(0, input.oldDurationSeconds);
  const punchEnd = Math.max(0, input.originSeconds) + Math.max(0, input.takeDurationSeconds);
  return Math.max(oldEnd, punchEnd);
}

export function punchInNeedsFfmpeg(segments: PunchInSegment[]): boolean {
  return segments.some((segment) => segment.kind !== 'new');
}
