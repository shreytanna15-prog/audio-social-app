import { describe, expect, it } from 'vitest';

import { isPlaybackNearEnd } from './playback-position';

describe('isPlaybackNearEnd', () => {
  it('is true when playhead is at the end of the take', () => {
    expect(isPlaybackNearEnd(4.9, 4.9)).toBe(true);
  });

  it('is true within the EOF epsilon', () => {
    expect(isPlaybackNearEnd(4.5, 4.9)).toBe(true);
  });

  it('is false in the middle of the take', () => {
    expect(isPlaybackNearEnd(2.0, 4.9)).toBe(false);
  });

  it('is true slightly before exact EOF (0.5s window)', () => {
    expect(isPlaybackNearEnd(13.2, 13.5)).toBe(true);
  });

  it('is false when duration is unknown', () => {
    expect(isPlaybackNearEnd(0, 0)).toBe(false);
  });
});
