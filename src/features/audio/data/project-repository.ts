import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';
import { deleteAsync, readAsStringAsync, writeAsStringAsync } from 'expo-file-system/legacy';
import { documentDirectory } from 'expo-file-system/legacy';

import { fileExists, persistFile } from '@/features/audio/data/file-persist';
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
import { PROJECT_VERSION } from '@/features/audio/types/project';
import type { TrackKind, TrackRecord } from '@/features/tracks/types';
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

function layerDurationMs(layer: ProjectLayer | StoredProjectLayer): number {
  if ('durationMs' in layer && typeof layer.durationMs === 'number') {
    return Math.max(0, Math.round(layer.durationMs));
  }
  if (
    'durationSeconds' in layer &&
    typeof layer.durationSeconds === 'number'
  ) {
    return Math.max(0, Math.round(layer.durationSeconds * 1000));
  }
  return 0;
}

function toStoredLayer(
  layer: ProjectLayer,
  recordingId: string,
  sortIndex: number,
  now: string,
  existing?: StoredProjectLayer,
): StoredProjectLayer {
  const durationMs = layerDurationMs(layer);
  return {
    id: layer.id,
    sortIndex,
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
    captureFx: normalizeStoredEditChain(layer.captureFx),
    muted: layer.muted,
    offsetMs: layer.offsetMs,
    durationMs,
    appliedEffects: existing?.appliedEffects ?? [],
    peaks: layer.peaks.length > 0 ? layer.peaks : null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

function fromStoredLayer(layer: StoredProjectLayer): ProjectLayer {
  const durationMs = layerDurationMs(layer);
  return {
    id: layer.id,
    kind: layer.kind,
    name: layer.name,
    stemUri: resolveDocumentRelativeUri(layer.stemPath),
    baselineUri: resolveDocumentRelativeUri(layer.baselinePath),
    sourceUri: resolveDocumentRelativeUri(layer.sourcePath),
    editChain: normalizeStoredEditChain(layer.editChain),
    captureFx: normalizeStoredEditChain(layer.captureFx),
    muted: layer.muted,
    offsetMs: layer.offsetMs,
    durationSeconds: durationMs / 1000,
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

  // Stem is required. Missing pending source/baseline (e.g. punch-in cleanup)
  // must not fail Save — fall back to the live stem.
  const stemSource = fileExists(layer.stemUri) ? layer.stemUri : null;
  if (!stemSource) {
    throw new Error(`Layer stem is not accessible: ${layer.stemUri}`);
  }

  if (layer.stemUri !== stemUri) {
    await persistFile(stemSource, stemUri);
  }

  const baselineSource =
    layer.baselineUri && fileExists(layer.baselineUri)
      ? layer.baselineUri
      : stemSource;
  if (baselineSource !== baselineUri) {
    await persistFile(baselineSource, baselineUri);
  }

  const sourceSource =
    layer.sourceUri && fileExists(layer.sourceUri)
      ? layer.sourceUri
      : stemSource;
  if (sourceSource !== sourceUri) {
    await persistFile(sourceSource, sourceUri);
  }

  return {
    ...layer,
    stemUri,
    baselineUri,
    sourceUri,
  };
}

async function readExistingStoredProject(
  recordingId: string,
): Promise<StoredAudioProject | null> {
  try {
    const contents = await readAsStringAsync(
      getRecordingProjectFileUri(recordingId),
    );
    const parsed = JSON.parse(contents) as StoredAudioProject;
    if (!parsed || !Array.isArray(parsed.layers)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function writeProjectFile(
  recordingId: string,
  project: AudioProject,
  track: TrackRecord,
): Promise<void> {
  const existing = await readExistingStoredProject(recordingId);
  const existingById = new Map(
    (existing?.layers ?? []).map((layer) => [layer.id, layer]),
  );
  const now = track.updatedAt;

  const stored: StoredAudioProject = {
    version: PROJECT_VERSION,
    id: track.id,
    kind: track.kind,
    status: track.status,
    title: track.title,
    durationMs: track.durationMs,
    mixPath: track.mixPath ?? undefined,
    publishedAt: track.publishedAt,
    createdAt: track.createdAt,
    updatedAt: track.updatedAt,
    selectedLayerId: project.selectedLayerId,
    layers: project.layers.map((layer, index) =>
      toStoredLayer(layer, recordingId, index, now, existingById.get(layer.id)),
    ),
  };

  const projectUri = getRecordingProjectFileUri(recordingId);
  const parent = new File(projectUri).parentDirectory;
  if (!parent.exists) {
    parent.create({ intermediates: true });
  }

  await writeAsStringAsync(projectUri, JSON.stringify(stored, null, 2));
}

async function cleanupPendingUris(
  uris: Array<string | null | undefined>,
): Promise<void> {
  for (const uri of uris) {
    if (
      !uri ||
      (!uri.includes(PENDING_FOLDER) && !uri.includes('/_processed/'))
    ) {
      continue;
    }

    try {
      await deleteAsync(uri, { idempotent: true });
    } catch {
      // ignore
    }
  }
}

export type LoadedProjectBundle = {
  id: string;
  title: string;
  project: AudioProject;
};

export async function loadProjectById(trackId: string): Promise<AudioProject | null> {
  const loaded = await loadProjectBundle(trackId);
  return loaded?.project ?? null;
}

export async function loadProjectBundle(
  trackId: string,
): Promise<LoadedProjectBundle | null> {
  const projectUri = getRecordingProjectFileUri(trackId);

  try {
    const contents = await readAsStringAsync(projectUri);
    const parsed = JSON.parse(contents) as StoredAudioProject;
    if (!parsed || !Array.isArray(parsed.layers)) {
      return null;
    }

    return {
      id: typeof parsed.id === 'string' && parsed.id ? parsed.id : trackId,
      title:
        typeof parsed.title === 'string' && parsed.title.trim()
          ? parsed.title.trim()
          : 'Untitled take',
      project: {
        version: PROJECT_VERSION,
        selectedLayerId: parsed.selectedLayerId,
        layers: parsed.layers.map(fromStoredLayer),
      },
    };
  } catch {
    return null;
  }
}

/** Persist rename without rewriting stems. */
export async function updateProjectTitle(
  trackId: string,
  title: string,
): Promise<void> {
  const projectUri = getRecordingProjectFileUri(trackId);
  const contents = await readAsStringAsync(projectUri);
  const parsed = JSON.parse(contents) as StoredAudioProject;
  if (!parsed || !Array.isArray(parsed.layers)) {
    throw new Error(`Project not found: ${trackId}`);
  }

  parsed.title = title.trim() || 'Untitled take';
  parsed.updatedAt = new Date().toISOString();
  await writeAsStringAsync(projectUri, JSON.stringify(parsed, null, 2));
}

export async function loadProjectForRecording(
  recording: AudioRecording,
): Promise<AudioProject> {
  const loaded = await loadProjectById(recording.id);
  if (loaded) {
    return loaded;
  }
  return wrapLegacyRecording(recording);
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
  title?: string;
  kind?: TrackKind;
  /** When set, files are written under this track id (must match backend row). */
  id?: string;
  /** Skip local index.json (backend is catalog source of truth). */
  skipIndex?: boolean;
};

function resolveTrackKind(
  project: AudioProject,
  kind?: TrackKind,
): TrackKind {
  if (kind === 'SINGLE' || kind === 'MULTI') {
    return kind;
  }
  return project.layers.length > 1 ? 'MULTI' : 'SINGLE';
}

export async function saveProject({
  project,
  mixdownUri,
  title,
  kind,
  id: providedId,
  skipIndex = false,
}: SaveProjectInput): Promise<AudioRecording> {
  const id = providedId ?? Crypto.randomUUID();
  const now = new Date().toISOString();

  await ensureRecordingsRoot();

  const persistedLayers: ProjectLayer[] = [];
  for (const layer of project.layers) {
    persistedLayers.push(await persistLayerFiles(id, layer));
  }

  const persistedProject: AudioProject = {
    ...project,
    version: PROJECT_VERSION,
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

  const durationSeconds = projectDurationSeconds(persistedProject);
  const mixPath = getRecordingMixdownRelativePath(id);
  const trackKind = resolveTrackKind(persistedProject, kind);
  const track: TrackRecord = {
    id,
    kind: trackKind,
    status: 'DRAFT',
    title: title?.trim() || 'Untitled take',
    durationMs: Math.max(0, Math.round(durationSeconds * 1000)),
    mixPath,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  await writeProjectFile(id, persistedProject, track);

  await cleanupPendingUris([
    mixSource,
    ...project.layers.flatMap((layer) => [
      layer.stemUri,
      layer.baselineUri,
      layer.sourceUri,
    ]),
  ]);

  const recording: AudioRecording = {
    ...track,
    mixPath,
    uri: destinationUri,
    duration: durationSeconds,
    type: 'draft',
    path: mixPath,
    projectPath: getRecordingProjectRelativePath(id),
  };

  if (!skipIndex) {
    const index = await readIndex();
    index.unshift(recording);
    await writeIndex(index);
  }

  return recording;
}

export async function updateProject({
  id,
  project,
  mixdownUri,
  title,
  kind,
  keepSourceFiles = false,
  skipIndex = false,
}: SaveProjectInput & {
  id: string;
  keepSourceFiles?: boolean;
}): Promise<AudioRecording> {
  const recordings = skipIndex ? [] : await readIndex();
  const existing = recordings.find((item) => item.id === id);

  await ensureRecordingsRoot();

  const persistedLayers: ProjectLayer[] = [];
  for (const layer of project.layers) {
    persistedLayers.push(await persistLayerFiles(id, layer));
  }

  const persistedProject: AudioProject = {
    ...project,
    version: PROJECT_VERSION,
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

  const now = new Date().toISOString();
  const durationSeconds = projectDurationSeconds(persistedProject);
  const mixPath = getRecordingMixdownRelativePath(id);
  const trackKind = resolveTrackKind(
    persistedProject,
    kind ?? existing?.kind,
  );
  const track: TrackRecord = {
    id,
    kind: trackKind,
    status: existing?.status ?? 'DRAFT',
    title: title?.trim() || existing?.title || 'Untitled take',
    durationMs: Math.max(0, Math.round(durationSeconds * 1000)),
    mixPath,
    publishedAt: existing?.publishedAt ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await writeProjectFile(id, persistedProject, track);

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

  const updated: AudioRecording = {
    ...(existing ?? {
      type: 'draft' as const,
      path: mixPath,
      uri: destinationUri,
      duration: durationSeconds,
    }),
    ...track,
    mixPath,
    uri: destinationUri,
    duration: durationSeconds,
    type: track.status === 'PUBLISHED' ? 'uploaded' : 'draft',
    path: mixPath,
    projectPath: getRecordingProjectRelativePath(id),
  };

  if (!skipIndex) {
    if (existing) {
      await writeIndex(
        recordings.map((item) => (item.id === id ? updated : item)),
      );
    } else {
      await writeIndex([updated, ...recordings]);
    }
  }

  return updated;
}

export function emptyPendingProject(): AudioProject {
  return createEmptyProject();
}
