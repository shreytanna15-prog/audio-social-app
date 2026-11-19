import { discardPreviewRecording } from '@/features/audio/data/recording-repository';
import { peakBarCountForDuration } from '@/features/audio/domain/timeline';
import { extractPeaksFromWav } from '@/features/audio/services/peak-extract.service';
import { mergeVocalPunchIn } from '@/features/audio/services/punch-in-merge.service';
import type { AudioProject } from '@/features/audio/types/project';

export type AttachVocalTakeInput = {
  project: AudioProject;
  layerId: string;
  stemUri: string;
  sourceUri: string | null;
  durationSeconds: number;
  originSeconds: number;
  replaceAll: boolean;
};

export type AttachVocalTakeResult = {
  project: AudioProject;
  stemUri: string;
};

/**
 * Merges or replaces a vocal take on a layer, extracts peaks, and discards
 * superseded temp files. Pure async — callers own React state commits.
 */
export async function attachVocalTake(
  input: AttachVocalTakeInput,
): Promise<AttachVocalTakeResult> {
  const layer = input.project.layers.find((item) => item.id === input.layerId);
  if (!layer) {
    throw new Error(`Cannot attach take: layer ${input.layerId} is not in the project.`);
  }

  const { originSeconds, replaceAll } = input;

  let stemUri = input.stemUri;
  let durationSeconds = input.durationSeconds;
  let offsetMs = Math.round(originSeconds * 1000);
  let merged = false;

  try {
    const mergedTake = await mergeVocalPunchIn({
      layer,
      newUri: input.stemUri,
      takeDurationSeconds: input.durationSeconds,
      originSeconds,
      replaceAll,
    });
    stemUri = mergedTake.uri;
    durationSeconds = mergedTake.durationSeconds;
    offsetMs = mergedTake.offsetMs;
    merged = mergedTake.merged;
  } catch (error) {
    console.warn('[Studio] punch-in merge failed; keeping offset take.', error);
    stemUri = input.stemUri;
    durationSeconds = input.durationSeconds;
    offsetMs = Math.round(originSeconds * 1000);
    merged = false;
  }

  // Pre-gate raw for re-clean. After punch-in merge the composite stem is the
  // new ground truth — keep pointing source at it so we never reference a
  // discarded punch fragment.
  const sourceUri = merged ? stemUri : (input.sourceUri ?? input.stemUri);
  const previousStemUri = layer.stemUri ?? null;
  const keepUris = new Set([stemUri, sourceUri]);

  const nextLayers = input.project.layers.map((item) => {
    if (item.id !== input.layerId) {
      return item;
    }

    return {
      ...item,
      stemUri,
      baselineUri: stemUri,
      sourceUri,
      durationSeconds,
      offsetMs,
      editChain: undefined,
      peaks: [],
    };
  });

  let nextProject: AudioProject = {
    ...input.project,
    layers: nextLayers,
    selectedLayerId: input.layerId,
  };

  if ((merged || replaceAll) && previousStemUri && !keepUris.has(previousStemUri)) {
    void discardPreviewRecording(previousStemUri);
  }
  if (merged && input.stemUri && !keepUris.has(input.stemUri)) {
    void discardPreviewRecording(input.stemUri);
  }
  if (
    merged &&
    input.sourceUri &&
    !keepUris.has(input.sourceUri)
  ) {
    void discardPreviewRecording('', input.sourceUri);
  }

  const peaks = await extractPeaksFromWav(
    stemUri,
    peakBarCountForDuration(durationSeconds),
  );

  const attached = nextProject.layers.find((item) => item.id === input.layerId);
  if (attached?.stemUri === stemUri) {
    nextProject = {
      ...nextProject,
      layers: nextProject.layers.map((item) =>
        item.id === input.layerId ? { ...item, peaks } : item,
      ),
    };
  }

  return { project: nextProject, stemUri };
}
