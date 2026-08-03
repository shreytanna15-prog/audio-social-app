import * as Crypto from "expo-crypto";
import { File } from "expo-file-system";

import { ensureRecordingsRoot } from "@/features/audio/data/recording-storage";
import { deleteFileIfExists } from "@/features/audio/services/ffmpeg.service";
import {
  initSuperpowered,
  isSuperpoweredAvailable,
  processFileWithSuperpoweredEffects,
} from "@/features/audio/services/superpowered-audio.service";
import {
  getAutotuneNativeScale,
  getAutotuneNativeSpeed,
  isEditChainEmpty,
  type EditChainSelection,
} from "@/features/audio/types/edit-chips";
import { toFileUri } from "@/features/audio/utils/ffmpeg-path";
import { getProcessedRecordingUri } from "@/features/audio/utils/recording-paths";

type EffectJsonItem = {
  id: string;
  params: Record<string, string | number>;
};

function echoParams(
  preset: NonNullable<EditChainSelection["echo"]>,
): EffectJsonItem["params"] {
  // intensity = send depth (native mixes dry + wet sends)
  if (preset === "resonant-buzz") {
    return { delay: 1, intensity: 18, preset };
  }
  if (preset === "eighth-note-bounce") {
    return { delay: 3, intensity: 24, preset };
  }
  if (preset === "slinky") {
    return { delay: 2, intensity: 24, preset };
  }
  if (preset === "right-to-left") {
    return { delay: 2, intensity: 22, preset };
  }
  // coin-drop — louder presence
  return { delay: 1, intensity: 28, preset };
}

function reverbParams(
  preset: NonNullable<EditChainSelection["reverb"]>,
): EffectJsonItem["params"] {
  // amount = send depth
  if (preset === "cathedral") {
    return { roomSize: 4, amount: 26, preset };
  }
  if (preset === "large-hall") {
    return { roomSize: 3, amount: 24, preset };
  }
  if (preset === "stereo-width") {
    return { roomSize: 2, amount: 20, preset };
  }
  if (preset === "long-narrow") {
    return { roomSize: 3, amount: 22, preset };
  }
  if (preset === "small-club") {
    return { roomSize: 1, amount: 18, preset };
  }
  // medium-room
  return { roomSize: 2, amount: 19, preset };
}

/** One pitch stage only: FX wins over Autotune. FX owns its Key. */
function resolvePitchEffects(selection: EditChainSelection): EffectJsonItem[] {
  if (selection.fx) {
    return [
      {
        id: "fx",
        params: {
          preset: selection.fx.preset,
          scale: getAutotuneNativeScale(selection.fx.scale),
        },
      },
    ];
  }

  if (selection.autotune) {
    return [
      {
        id: "autotune",
        params: {
          scale: getAutotuneNativeScale(selection.autotune.scale),
          speed: getAutotuneNativeSpeed(selection.autotune.speed),
        },
      },
    ];
  }

  return [];
}

/**
 * Build effects JSON for native. Chip tap order is irrelevant — selection is a set.
 * Native always runs: pitch → input-normalize → Comp → EQ → Echo → Reverb → limiter.
 * Push order here matches that list for readability only.
 */
function buildSuperpoweredEffectsJson(selection: EditChainSelection): string {
  const effects: EffectJsonItem[] = [...resolvePitchEffects(selection)];

  if (selection.compressor) {
    effects.push({
      id: "compressor",
      params: { preset: selection.compressor },
    });
  }
  if (selection.eq) {
    effects.push({
      id: "eq",
      params: { preset: selection.eq },
    });
  }
  if (selection.echo) {
    effects.push({
      id: "echo",
      params: echoParams(selection.echo),
    });
  }
  if (selection.reverb) {
    effects.push({
      id: "reverb",
      params: reverbParams(selection.reverb),
    });
  }

  return JSON.stringify(effects);
}

async function copyFile(
  sourceUri: string,
  destinationUri: string,
): Promise<void> {
  const destination = new File(destinationUri);
  const parent = destination.parentDirectory;
  if (!parent.exists) {
    parent.create({ intermediates: true, idempotent: true });
  }

  const source = new File(sourceUri);
  const bytes = source.exists
    ? await source.bytes()
    : new Uint8Array(await (await fetch(sourceUri)).arrayBuffer());

  destination.create({ overwrite: true });
  destination.write(bytes);
}

/**
 * Rebuild edit chain from soft-gated baseline (and optional Clean Voice from pre-gate).
 * Never mutates baseline / pre-gate files.
 */
export async function applyEditChain(input: {
  baselineUri: string;
  sourcePreGateUri: string | null;
  selection: EditChainSelection;
}): Promise<string> {
  const { baselineUri, sourcePreGateUri, selection } = input;

  if (isEditChainEmpty(selection)) {
    return baselineUri;
  }

  await ensureRecordingsRoot();

  let chainInputUri = baselineUri;
  let cleanVoiceTempUri: string | null = null;

  if (selection.cleanVoice) {
    if (!sourcePreGateUri) {
      throw new Error("Clean Voice needs the original pre-gate recording.");
    }

    const { isDeepFilterDenoiseAvailable, denoiseRecordingWithDeepFilter } =
      await import("@/features/audio/services/deepfilter-denoise.service");

    if (!(await isDeepFilterDenoiseAvailable())) {
      throw new Error("Clean Voice requires DeepFilterNet on this device.");
    }

    cleanVoiceTempUri = toFileUri(
      getProcessedRecordingUri("clean-voice", Crypto.randomUUID()),
    );
    const parent = new File(cleanVoiceTempUri).parentDirectory;
    if (!parent.exists) {
      parent.create({ intermediates: true, idempotent: true });
    }

    console.warn("[EditChain] Clean Voice (DeepFilter) from pre-gate…");
    await denoiseRecordingWithDeepFilter(sourcePreGateUri, cleanVoiceTempUri);
    chainInputUri = cleanVoiceTempUri;
  }

  const hasSuperpoweredFx =
    selection.autotune != null ||
    selection.fx != null ||
    selection.compressor != null ||
    selection.eq != null ||
    selection.echo != null ||
    selection.reverb != null;

  if (!hasSuperpoweredFx) {
    // Clean Voice only — return denoised WAV as working file.
    return chainInputUri;
  }

  if (!isSuperpoweredAvailable()) {
    throw new Error(
      "Superpowered native module is not available for edit chips.",
    );
  }

  const initialized = await initSuperpowered();
  if (!initialized) {
    throw new Error(
      "Superpowered init failed (check EXPO_PUBLIC_SUPERPOWERED_LICENSE_KEY).",
    );
  }

  const outputUri = toFileUri(
    getProcessedRecordingUri("edit-chain", Crypto.randomUUID()),
  );
  const parent = new File(outputUri).parentDirectory;
  if (!parent.exists) {
    parent.create({ intermediates: true, idempotent: true });
  }

  const effectsJson = buildSuperpoweredEffectsJson(selection);
  console.warn(`[EditChain] Superpowered chain ${effectsJson}`);

  await processFileWithSuperpoweredEffects(
    chainInputUri,
    outputUri,
    effectsJson,
  );

  if (cleanVoiceTempUri && cleanVoiceTempUri !== outputUri) {
    await deleteFileIfExists(cleanVoiceTempUri);
  }

  return outputUri;
}

export async function persistBaselineCopy(
  baselineUri: string,
): Promise<string> {
  const outputUri = toFileUri(
    getProcessedRecordingUri("baseline-copy", Crypto.randomUUID()),
  );
  await copyFile(baselineUri, outputUri);
  return outputUri;
}
