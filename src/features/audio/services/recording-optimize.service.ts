import { File } from "expo-file-system";
import { documentDirectory } from "expo-file-system/legacy";
import { Platform } from "react-native";

import { logOptimizeDuration } from "@/features/audio/domain/recording-optimize-log";
import { deleteFileIfExists } from "@/features/audio/services/ffmpeg.service";
import { toFileUri } from "@/features/audio/utils/ffmpeg-path";

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

/**
 * Soft SpectralGate (mild) denoise for record/import staging.
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
    `[Optimize] Branch=SpectralGate soft/mild input="${inputUri}"`,
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

/** @deprecated Legacy Clean pipelines — prefer applyEditChain. Kept for any stray callers. */
export async function optimizeRecordingForPreview(
  inputUri: string,
  outputUri: string,
  mode: "speech" | "instrument" | "mixed" = "speech",
  _durationSeconds?: number,
): Promise<string> {
  if (Platform.OS === "web") {
    throw new Error(
      "Recording optimization is only available on iOS and Android.",
    );
  }

  const {
    initSuperpowered,
    isSuperpoweredAvailable,
  } = await import("@/features/audio/services/superpowered-audio.service");

  if (!isSuperpoweredAvailable() || !(await initSuperpowered())) {
    throw new Error("Superpowered unavailable for legacy Clean pipeline.");
  }

  const { polishRecordingWithSuperpowered } = await import(
    "@/features/audio/services/superpowered-polish.service"
  );

  if (mode === "speech") {
    const {
      isDeepFilterDenoiseAvailable,
      denoiseRecordingWithDeepFilter,
    } = await import("@/features/audio/services/deepfilter-denoise.service");

    if (!(await isDeepFilterDenoiseAvailable())) {
      throw new Error("DeepFilterNet unavailable for speech Clean.");
    }

    const denoisedWavUri = createTempUri("deepfilter-denoised", "wav");
    try {
      await denoiseRecordingWithDeepFilter(inputUri, denoisedWavUri);
      await polishRecordingWithSuperpowered({
        inputUri: denoisedWavUri,
        outputUri,
        mode: "speech",
        preset: "speech-clean",
      });
    } finally {
      await deleteFileIfExists(denoisedWavUri);
    }
  } else {
    await polishRecordingWithSuperpowered({
      inputUri,
      outputUri,
      mode,
      preset: mode === "instrument" ? "instrument-clean" : "mixed-clean",
    });
  }

  return outputUri;
}
