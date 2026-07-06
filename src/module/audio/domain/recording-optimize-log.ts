import { isFfmpegFilterAvailable } from '@/module/audio/utils/ffmpeg-filter-availability';

export type FfmpegDenoiseFilterAvailability = {
  afftdn: boolean;
  anlmdn: boolean;
  asendcmd: boolean;
};

/** Speech-mode optimize strategies. */
export type SpeechOptimizeStrategy =
  | 'deepfilter-net'
  | 'arnndn-with-mix'
  | 'arnndn'
  | 'afftdn';

/** Instrument / mixed chunked or single-pass strategies (dynamic suffix allowed). */
export type ChunkedOptimizeStrategy =
  | `chunked-instrument-polish-only`
  | `chunked-instrument-mild`
  | `chunked-instrument-medium`
  | `chunked-instrument-mixed`
  | `chunked-mixed-polish-only`
  | `chunked-mixed-mild`
  | `chunked-mixed-medium`
  | `chunked-mixed-mixed`
  | `single-pass-instrument-polish-only`
  | `single-pass-instrument-mild`
  | `single-pass-instrument-medium`
  | `single-pass-mixed-polish-only`
  | `single-pass-mixed-mild`
  | `single-pass-mixed-medium`;

/** Fallback when chunked / single-pass processing fails. */
export type NonSpeechFallbackStrategy = 'polish-only' | 'legacy-afftdn';

export type OptimizeStrategyName =
  | SpeechOptimizeStrategy
  | ChunkedOptimizeStrategy
  | NonSpeechFallbackStrategy
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
