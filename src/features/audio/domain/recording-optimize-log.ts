/** Speech-mode optimize strategies (DeepFilter + Superpowered only). */
export type SpeechOptimizeStrategy =
  | 'deepfilter + speech-clean'
  | 'speech-clean'
  | 'deepfilter-net';

/**
 * Instrument / mixed Clean strategies.
 * Instrument / mixed default: Superpowered polish only (instrument-clean / mixed-clean).
 */
export type NonSpeechOptimizeStrategy =
  | 'interference-soften + instrument-clean'
  | 'instrument-clean'
  | 'mixed-clean'
  | 'spectral-instrument-stub'
  | 'spectral-instrument-passthrough'
  | 'spectral-instrument'
  | 'interference-soften'
  | 'superpowered-instrument'
  | 'superpowered-mixed';

/** Raw expo-audio capture with no denoise/polish. */
export type RawOptimizeStrategy = 'passthrough';

export type OptimizeStrategyName =
  | SpeechOptimizeStrategy
  | NonSpeechOptimizeStrategy
  | RawOptimizeStrategy
  | (string & {});

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
