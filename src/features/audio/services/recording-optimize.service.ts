import { File } from "expo-file-system";
import { documentDirectory } from "expo-file-system/legacy";
import { Platform } from "react-native";

import {
  logChosenOptimizeStrategy,
  logOptimizeDuration,
} from "@/features/audio/domain/recording-optimize-log";
import { isShortClip } from "@/features/audio/domain/recording-optimize.constants";
import type { SuperpoweredPolishPreset } from "@/features/audio/domain/superpowered-polish-presets";
import {
  deleteFileIfExists,
  resolveProcessedFileUri,
} from "@/features/audio/services/ffmpeg.service";
import {
  initSuperpowered,
  isSuperpoweredAvailable,
} from "@/features/audio/services/superpowered-audio.service";
import type { RecordingMode } from "@/features/audio/types/recording-mode";
import {
  isPassthroughCaptureMode,
  keepsSourceExtension,
} from "@/features/audio/types/recording-mode";
import { assertFfmpegAvailable } from "@/features/audio/utils/ffmpeg-availability";
import { toFileUri } from "@/features/audio/utils/ffmpeg-path";

const SPEECH_SUPERPOWERED_STRATEGY = "deepfilter + speech-clean";
const INSTRUMENT_CLEAN_STRATEGY = "instrument-clean";
const MIXED_CLEAN_STRATEGY = "mixed-clean";

function createTempUri(prefix: string, extension: string): string {
  if (!documentDirectory) {
    throw new Error("Document directory is not available.");
  }

  const uri = toFileUri(
    `${documentDirectory}temp/${prefix}-${Date.now()}.${extension}`,
  );
  const parent = new File(uri).parentDirectory;
  if (!parent.exists) {
    parent.create({ intermediates: true, idempotent: true });
  }
  return uri;
}

function createTempDenoisedWavUri(): string {
  return createTempUri("deepfilter-denoised", "wav");
}

/** Never throws — false when native module missing, init fails, or license missing. */
async function canUseSuperpowered(): Promise<boolean> {
  if (!isSuperpoweredAvailable()) {
    return false;
  }

  return initSuperpowered();
}

async function tryPolishWithSuperpowered(input: {
  inputUri: string;
  outputUri: string;
  mode: Exclude<
    RecordingMode,
    "raw" | "gate-lab" | "swm-wav" | "nitro-m4a"
  >;
  preset: SuperpoweredPolishPreset;
}): Promise<string | null> {
  if (!(await canUseSuperpowered())) {
    console.info(
      "[Optimize] Superpowered unavailable; skipping native polish.",
    );
    return null;
  }

  try {
    const { polishRecordingWithSuperpowered } =
      await import("@/features/audio/services/superpowered-polish.service");

    await polishRecordingWithSuperpowered({
      inputUri: input.inputUri,
      outputUri: input.outputUri,
      mode: input.mode,
      preset: input.preset,
    });

    return resolveProcessedFileUri(input.outputUri);
  } catch (error) {
    console.warn("[Optimize] Superpowered polish failed.", error);
    return null;
  }
}

/**
 * Speech path: DeepFilterNet denoise → Superpowered speech polish.
 * No FFmpeg denoise/polish fallback — caller passthroughs raw on failure.
 */
async function optimizeSpeechRecordingForPreview(
  inputUri: string,
  outputUri: string,
): Promise<{ uri: string; strategy: string }> {
  const {
    isDeepFilterDenoiseAvailable,
    denoiseRecordingWithDeepFilter,
  } = await import("@/features/audio/services/deepfilter-denoise.service");

  if (!(await isDeepFilterDenoiseAvailable())) {
    throw new Error(
      "DeepFilterNet unavailable. Speech optimize requires on-device DeepFilter.",
    );
  }

  const denoisedWavUri = createTempDenoisedWavUri();

  try {
    console.info("[Optimize] Trying DeepFilterNet denoise.");
    await denoiseRecordingWithDeepFilter(
      inputUri,
      denoisedWavUri,
      (progress) => {
        if (progress % 25 === 0) {
          console.info(`[Optimize] DeepFilter progress ${progress}%`);
        }
      },
    );

    const superpoweredUri = await tryPolishWithSuperpowered({
      inputUri: denoisedWavUri,
      outputUri,
      mode: "speech",
      preset: "speech-clean",
    });

    if (!superpoweredUri) {
      throw new Error(
        "Speech Clean requires Superpowered polish after DeepFilter.",
      );
    }

    logChosenOptimizeStrategy("speech", SPEECH_SUPERPOWERED_STRATEGY);
    console.info(`[Optimize] Applied ${SPEECH_SUPERPOWERED_STRATEGY}.`);
    return { uri: superpoweredUri, strategy: SPEECH_SUPERPOWERED_STRATEGY };
  } finally {
    await deleteFileIfExists(denoisedWavUri);
  }
}

/**
 * Instrument / mixed Clean: Superpowered polish only (no spectral soften).
 */
async function optimizeNonSpeechClean(
  inputUri: string,
  outputUri: string,
  mode: "instrument" | "mixed",
  preset: "instrument-clean" | "mixed-clean",
  strategy: string,
): Promise<{ uri: string; strategy: string }> {
  const superpoweredUri = await tryPolishWithSuperpowered({
    inputUri,
    outputUri,
    mode,
    preset,
  });

  if (!superpoweredUri) {
    throw new Error(
      `${mode} Clean requires Superpowered (HPF → EQ → comp → limiter). Native module unavailable or failed.`,
    );
  }

  logChosenOptimizeStrategy(mode, strategy);
  console.info(`[Optimize] Applied ${strategy} (Voloco-Clean soft polish).`);
  return { uri: superpoweredUri, strategy };
}

/**
 * SpectralGate denoise only (no Clean polish, no FFmpeg).
 * Used by Capture A (`raw`) before pending.
 */
export async function optimizeNsSpectralForPreview(
  inputUri: string,
  outputWavUri: string,
): Promise<string> {
  if (Platform.OS === "web") {
    throw new Error(
      "NS+Spectral optimize is only available on iOS and Android.",
    );
  }

  const startedAt = Date.now();
  console.warn(
    `[Optimize] Branch=SpectralGate only input="${inputUri}"`,
  );

  const { softenInstrumentToWav } = await import(
    "@/features/audio/services/spectral-clean.service"
  );

  const result = await softenInstrumentToWav(inputUri, outputWavUri);
  logOptimizeDuration("spectral-gate", result.strategy, Date.now() - startedAt);
  console.warn(
    `[Optimize] SpectralGate done strategy="${result.strategy}" uri=${result.uri}`,
  );
  return result.uri;
}

/**
 * Post-record enhance for preview/editor.
 * Speech: DeepFilter → speech-clean polish (no FFmpeg denoise fallback).
 * Instrument / mixed: light Superpowered Clean polish only.
 * Raw: SpectralGate only via stagePreviewRecording → optimizeNsSpectralForPreview.
 * Gate Lab / SWM WAV / Nitro M4A: passthrough staging; SpectralGate + pipelines in the editor.
 * Editor effects: Superpowered (+ DeepFilter for denoise) via audio-effects.service.
 */
export async function optimizeRecordingForPreview(
  inputUri: string,
  outputUri: string,
  mode: RecordingMode = "speech",
  durationSeconds?: number,
): Promise<string> {
  if (Platform.OS === "web") {
    throw new Error(
      "Recording optimization is only available on iOS and Android.",
    );
  }

  if (keepsSourceExtension(mode) || isPassthroughCaptureMode(mode)) {
    throw new Error(
      `${mode} mode must skip optimizeRecordingForPreview; use stagePreviewRecording.`,
    );
  }

  const startedAt = Date.now();
  const shortClip = isShortClip(durationSeconds);
  let strategyLabel = String(mode);

  try {
    console.warn(
      `[Optimize] start mode="${mode}" duration=${durationSeconds?.toFixed(2) ?? "unknown"}s shortClip=${shortClip}`,
    );

    if (mode === "instrument") {
      console.warn("[Optimize] Branch=instrument (no DeepFilter)");
      assertFfmpegAvailable();
      const result = await optimizeNonSpeechClean(
        inputUri,
        outputUri,
        "instrument",
        "instrument-clean",
        INSTRUMENT_CLEAN_STRATEGY,
      );
      strategyLabel = result.strategy;
      logOptimizeDuration("instrument", strategyLabel, Date.now() - startedAt);
      return result.uri;
    }

    if (mode === "mixed") {
      console.warn("[Optimize] Branch=mixed (no DeepFilter)");
      assertFfmpegAvailable();
      const result = await optimizeNonSpeechClean(
        inputUri,
        outputUri,
        "mixed",
        "mixed-clean",
        MIXED_CLEAN_STRATEGY,
      );
      strategyLabel = result.strategy;
      logOptimizeDuration("mixed", strategyLabel, Date.now() - startedAt);
      return result.uri;
    }

    console.warn("[Optimize] Branch=speech → DeepFilter path");
    assertFfmpegAvailable();

    const result = await optimizeSpeechRecordingForPreview(
      inputUri,
      outputUri,
    );
    strategyLabel = result.strategy;
    logOptimizeDuration("speech", strategyLabel, Date.now() - startedAt);
    return result.uri;
  } catch (error) {
    logOptimizeDuration(mode, `error:${strategyLabel}`, Date.now() - startedAt);
    console.warn(
      `[Optimize] ${mode} enhance failed after ${Date.now() - startedAt}ms.`,
      error,
    );
    throw error;
  }
}
