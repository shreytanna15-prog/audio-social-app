import type { FeedPreviewAudioSource } from './data/feed-preview-audio';

export type FeedVibe = {
  id: string;
  title: string;
  subtitle?: string;
  artist: string;
  artistId?: string;
  artistAvatarUrl: string;
  coverUrl: string;
  genresLabel: string;
  bpm: number;
  verified: boolean;
  likesLabel: string;
  commentsLabel: string;
  sharesLabel: string;
  /** Full track length shown on CTA */
  durationSec: number;
  /**
   * Fallback preview length while the player reports duration 0.
   * Live UI uses the real loaded duration once available.
   */
  previewDurationSec: number;
  /** Bundled `require()` audio module (or remote source). */
  previewAudio: FeedPreviewAudioSource;
  /** Peak bars for the static waveform (0–1), keyed to this preview. */
  waveformPeaks: number[];
};
