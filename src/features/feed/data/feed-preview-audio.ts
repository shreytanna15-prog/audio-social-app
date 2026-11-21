import type { AudioSource } from 'expo-audio';

/**
 * Bundled feed preview clips (30–45s preferred).
 * Metro requires static `require()` paths — add files under `assets/feed/` then
 * point each vibe at its own module below.
 *
 * Currently only `assets/demo.mp3` ships in the repo, so every vibe shares it
 * until distinct previews are added.
 */
export const FEED_PREVIEW_DEMO = require('../../../../assets/demo.mp3') as number;

/** Preferred per-vibe filenames once assets are added (see feed fixtures). */
export const FEED_PREVIEW_ASSET_PATHS = {
  'luminous-drift': 'assets/feed/luminous-drift.mp3',
  'astral-echoes': 'assets/feed/astral-echoes.mp3',
  'midnight-pulse': 'assets/feed/midnight-pulse.mp3',
  'velvet-rain': 'assets/feed/velvet-rain.mp3',
} as const;

export type FeedPreviewAudioSource = AudioSource;

/**
 * Deterministic bar heights derived from the bundled audio module id so the
 * waveform shape tracks the selected preview asset (same asset → same shape).
 */
export function buildPeaksForAudioSource(source: number, barCount = 48): number[] {
  return buildPeaksForSeed(String(source | 0), barCount);
}

/** Deterministic peaks from any string seed (track id / remote mix). */
export function buildPeaksForSeed(seed: string, barCount = 48): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  if (hash === 0) hash = 1;

  return Array.from({ length: barCount }, (_, i) => {
    const n =
      Math.abs(Math.sin(hash * 0.00017 + i * 0.47)) * 0.55 +
      Math.abs(Math.sin(hash * 0.00031 + i * 1.13)) * 0.45;
    return 0.22 + n * 0.78;
  });
}
