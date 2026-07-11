import { isFfmpegFilterAvailable } from '@/module/audio/utils/ffmpeg-filter-availability';

export type FfmpegDenoiseFilterAvailability = {
  afftdn: boolean;
  anlmdn: boolean;
  asendcmd: boolean;
};

/** Speech-mode optimize strategies. */
export type SpeechOptimizeStrategy =
  | 'deepfilter + superpowered-speech'
  | 'superpowered-speech-short'
  | 'deepfilter-net'
  | 'arnndn-with-mix'
  | 'arnndn'
  | 'afftdn'
  | 'ffmpeg-speech-fallback'
  | 'polish-only';

/** Instrument / mixed Superpowered strategies (soft gate + polish; no FFmpeg optimize). */
export type NonSpeechOptimizeStrategy =
  | 'superpowered-instrument'
  | 'superpowered-mixed';

export type OptimizeStrategyName =
  | SpeechOptimizeStrategy
  | NonSpeechOptimizeStrategy
  | (string & {});

export async function resolveFfmpegDenoiseFilterAvailability(): Promise<FfmpegDenoiseFilterAvailability> {
  const [afftdn, anlmdn, asendcmd] = await Promise.all([
    isFfmpegFilterAvailable('afftdn'),
    isFfmpegFilterAvailable('anlmdn'),
    isFfmpegFilterAvailable('asendcmd'),
  ]);

  return { afftdn, anlmdn, asendcmd };
}

export function logFfmpegDenoiseFilterAvailability(
  availability: FfmpegDenoiseFilterAvailability,
): void {
  console.info(
    `[Optimize] FFmpeg filters available: afftdn=${availability.afftdn}, anlmdn=${availability.anlmdn}, asendcmd=${availability.asendcmd}`,
  );
}

export function logChosenOptimizeStrategy(
  mode: string,
  strategy: OptimizeStrategyName,
): void {
  console.info(`[Optimize] mode="${mode}" strategy="${strategy}"`);
}

export function logOptimizeDuration(
  mode: string,
  strategy: string,
  durationMs: number,
): void {
  console.info(
    `[Optimize] mode="${mode}" strategy="${strategy}" completed in ${durationMs}ms`,
  );
}
