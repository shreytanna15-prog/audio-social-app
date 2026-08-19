import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';
import { deleteAsync, readAsStringAsync, writeAsStringAsync } from 'expo-file-system/legacy';
import { documentDirectory } from 'expo-file-system/legacy';

import { persistFile } from '@/features/audio/data/file-persist';
import {
  ensureRecordingsRoot,
  readIndex,
  writeIndex,
} from '@/features/audio/data/recording-storage';
import { normalizeStoredEditChain } from '@/features/audio/domain/edit-chain-persistence';
import {
  createEmptyProject,
  projectDurationSeconds,
  unmutedMixInputs,
  wrapLegacyRecording,
} from '@/features/audio/domain/project';
import { mixProjectStems } from '@/features/audio/services/mix-project.service';
import type { AudioRecording } from '@/features/audio/types/audio';
import type {
  AudioProject,
  ProjectLayer,
  StoredAudioProject,
  StoredProjectLayer,
} from '@/features/audio/types/project';
import {
  getLayerBaselineFileUri,
  getLayerBaselineRelativePath,
  getLayerSourceFileUri,
  getLayerSourceRelativePath,
  getLayerStemFileUri,
  getLayerStemRelativePath,
  getPendingProjectMixdownUri,
  getRecordingMixdownFileUri,
  getRecordingMixdownRelativePath,
  getRecordingProjectFileUri,
  getRecordingProjectRelativePath,
  PENDING_FOLDER,
  resolveDocumentRelativeUri,
} from '@/features/audio/utils/recording-paths';

function toRelativePath(uri: string): string | null {
  if (!documentDirectory || !uri.startsWith(documentDirectory)) {
    return null;
  }

  return uri.slice(documentDirectory.length);
}

function toStoredLayer(
  layer: ProjectLayer,
  recordingId: string,
): StoredProjectLayer {
  return {
    id: layer.id,
    kind: layer.kind,
    name: layer.name,
    stemPath: layer.stemUri
      ? (toRelativePath(layer.stemUri) ??
        getLayerStemRelativePath(recordingId, layer.id))
      : null,
    baselinePath: layer.baselineUri
      ? (toRelativePath(layer.baselineUri) ??
        getLayerBaselineRelativePath(recordingId, layer.id))
      : null,
    sourcePath: layer.sourceUri
      ? (toRelativePath(layer.sourceUri) ??
        getLayerSourceRelativePath(recordingId, layer.id))
      : null,
    editChain: normalizeStoredEditChain(layer.editChain),
    muted: layer.muted,
    offsetMs: layer.offsetMs,
    durationSeconds: layer.durationSeconds,
    peaks: layer.peaks,
  };
}

function fromStoredLayer(layer: StoredProjectLayer): ProjectLayer {
  return {
    id: layer.id,
    kind: layer.kind,
    name: layer.name,
    stemUri: resolveDocumentRelativeUri(layer.stemPath),
    baselineUri: resolveDocumentRelativeUri(layer.baselinePath),
    sourceUri: resolveDocumentRelativeUri(layer.sourcePath),
    editChain: normalizeStoredEditChain(layer.editChain),
    muted: layer.muted,
    offsetMs: layer.offsetMs,
    durationSeconds: layer.durationSeconds,
    peaks: layer.peaks ?? [],
  };
}

async function persistLayerFiles(
  recordingId: string,
  layer: ProjectLayer,
): Promise<ProjectLayer> {
  if (!layer.stemUri) {
    return {
      ...layer,
      stemUri: null,
      baselineUri: null,
      sourceUri: null,
    };
  }

  const stemUri = getLayerStemFileUri(recordingId, layer.id);
  const baselineUri = getLayerBaselineFileUri(recordingId, layer.id);
  const sourceUri = getLayerSourceFileUri(recordingId, layer.id);

  if (layer.stemUri !== stemUri) {
    await persistFile(layer.stemUri, stemUri);
  }

  if (layer.baselineUri && layer.baselineUri !== baselineUri) {
    await persistFile(layer.baselineUri, baselineUri);
  } else if (!layer.baselineUri) {
    await persistFile(layer.stemUri, baselineUri);
  }

  if (layer.sourceUri && layer.sourceUri !== sourceUri) {
    await persistFile(layer.sourceUri, sourceUri);
  } else if (!layer.sourceUri) {
    await persistFile(layer.stemUri, sourceUri);
  }

  return {
    ...layer,
    stemUri,
    baselineUri,
    sourceUri,
  };
}

async function writeProjectFile(
  recordingId: string,
  project: AudioProject,
): Promise<void> {
  const stored: StoredAudioProject = {
    version: 1,
    selectedLayerId: project.selectedLayerId,
    layers: project.layers.map((layer) => toStoredLayer(layer, recordingId)),
  };

  const projectUri = getRecordingProjectFileUri(recordingId);
  const parent = new File(projectUri).parentDirectory;
  if (!parent.exists) {
    parent.create({ intermediates: true });
  }

  await writeAsStringAsync(projectUri, JSON.stringify(stored, null, 2));
}

async function cleanupPendingUris(uris: Array<string | null | undefined>): Promise<void> {
  for (const uri of uris) {
    if (!uri || (!uri.includes(PENDING_FOLDER) && !uri.includes('/_processed/'))) {
      continue;
    }

    try {
      await deleteAsync(uri, { idempotent: true });
    } catch {
      // ignore
    }
  }
}

export async function loadProjectForRecording(
  recording: AudioRecording,
): Promise<AudioProject> {
  if (!recording.projectPath) {
    return wrapLegacyRecording(recording);
  }

  const projectUri = getRecordingProjectFileUri(recording.id);

  try {
    const contents = await readAsStringAsync(projectUri);
    const parsed = JSON.parse(contents) as StoredAudioProject;
    if (!parsed || !Array.isArray(parsed.layers)) {
      return wrapLegacyRecording(recording);
    }

    return {
      version: 1,
      selectedLayerId: parsed.selectedLayerId,
      layers: parsed.layers.map(fromStoredLayer),
    };
  } catch {
    return wrapLegacyRecording(recording);
  }
}

export async function mixProjectToUri(
  project: AudioProject,
  outputUri: string,
): Promise<string | null> {
  return mixProjectStems(unmutedMixInputs(project), outputUri);
}

export type SaveProjectInput = {
  project: AudioProject;
  mixdownUri?: string | null;
};

export async function saveProject({
  project,
  mixdownUri,
}: SaveProjectInput): Promise<AudioRecording> {
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();

  await ensureRecordingsRoot();

  const persistedLayers: ProjectLayer[] = [];
  for (const layer of project.layers) {
    persistedLayers.push(await persistLayerFiles(id, layer));
  }

  const persistedProject: AudioProject = {
    ...project,
    layers: persistedLayers,
  };

  const destinationUri = getRecordingMixdownFileUri(id);
  const mixSource =
    mixdownUri ??
    (await mixProjectToUri(persistedProject, getPendingProjectMixdownUri(id)));

  if (mixSource && mixSource !== destinationUri) {
    await persistFile(mixSource, destinationUri);
  } else if (!mixSource && persistedLayers[0]?.stemUri) {
    await persistFile(persistedLayers[0].stemUri, destinationUri);
  }

  await writeProjectFile(id, persistedProject);

  await cleanupPendingUris([
    mixSource,
    ...project.layers.flatMap((layer) => [
      layer.stemUri,
      layer.baselineUri,
      layer.sourceUri,
    ]),
  ]);

  const duration = projectDurationSeconds(persistedProject);
  const recording: AudioRecording = {
    id,
    uri: destinationUri,
    path: getRecordingMixdownRelativePath(id),
    projectPath: getRecordingProjectRelativePath(id),
    type: 'draft',
    duration,
    createdAt: now,
    updatedAt: now,
  };

  const index = await readIndex();
  index.unshift(recording);
  await writeIndex(index);

  return recording;
}

export async function updateProject({
  id,
  project,
  mixdownUri,
  keepSourceFiles = false,
}: SaveProjectInput & {
  id: string;
  keepSourceFiles?: boolean;
}): Promise<AudioRecording> {
  const recordings = await readIndex();
  const existing = recordings.find((item) => item.id === id);

  if (!existing) {
    throw new Error(`Recording not found: ${id}`);
  }

  await ensureRecordingsRoot();

  const persistedLayers: ProjectLayer[] = [];
  for (const layer of project.layers) {
    persistedLayers.push(await persistLayerFiles(id, layer));
  }

  const persistedProject: AudioProject = {
    ...project,
    layers: persistedLayers,
  };

  const destinationUri = getRecordingMixdownFileUri(id);
  let mixSource: string | null = mixdownUri ?? null;
  // Background persist copies stems only. Mixdown is the slow FFmpeg pass and
  // would stall Rec/Stop; Done still builds the share mix.
  if (!keepSourceFiles || mixdownUri) {
    mixSource =
      mixdownUri ??
      (await mixProjectToUri(persistedProject, getPendingProjectMixdownUri(id)));

    if (mixSource && mixSource !== destinationUri) {
      await persistFile(mixSource, destinationUri);
    }
  }

  await writeProjectFile(id, persistedProject);

  if (!keepSourceFiles) {
    await cleanupPendingUris([
      mixSource,
      ...project.layers.flatMap((layer) => [
        layer.stemUri,
        layer.baselineUri,
        layer.sourceUri,
      ]),
    ]);
  }

  const now = new Date().toISOString();
  const updated: AudioRecording = {
    ...existing,
    uri: destinationUri,
    path: getRecordingMixdownRelativePath(id),
    projectPath: getRecordingProjectRelativePath(id),
    duration: projectDurationSeconds(persistedProject),
    updatedAt: now,
  };

  await writeIndex(recordings.map((item) => (item.id === id ? updated : item)));
  return updated;
}

export function emptyPendingProject(): AudioProject {
  return createEmptyProject();
}
