import { File } from 'expo-file-system';
import { writeAsStringAsync } from 'expo-file-system/legacy';

import { persistFile } from '@/features/audio/data/file-persist';
import type {
  ProjectLayerKind,
  StoredAudioProject,
  StoredProjectLayer,
} from '@/features/audio/types/project';
import { PROJECT_VERSION } from '@/features/audio/types/project';
import {
  getLayerSourceFileUri,
  getLayerSourceRelativePath,
  getLayerStemFileUri,
  getLayerStemRelativePath,
  getRecordingMixdownFileUri,
  getRecordingMixdownRelativePath,
  getRecordingProjectFileUri,
} from '@/features/audio/utils/recording-paths';

import { getTrack } from './service';
import type { AppliedEffect, TrackDetail, TrackLayerDetail } from './types';

function isProjectLayerKind(value: string): value is ProjectLayerKind {
  return value === 'vocal' || value === 'beat' || value === 'import';
}

async function downloadToFile(url: string, destinationUri: string): Promise<void> {
  await persistFile(url, destinationUri);
}

async function copyLocalFile(
  sourceUri: string,
  destinationUri: string,
): Promise<void> {
  const destination = new File(destinationUri);
  const parent = destination.parentDirectory;
  if (!parent.exists) {
    parent.create({ intermediates: true });
  }
  const source = new File(sourceUri);
  const bytes = await source.bytes();
  destination.create({ overwrite: true });
  destination.write(bytes);
}

function toStoredLayer(
  trackId: string,
  layer: TrackLayerDetail,
  hasStem: boolean,
  hasSource: boolean,
): StoredProjectLayer {
  return {
    id: layer.id,
    sortIndex: layer.sortIndex,
    kind: isProjectLayerKind(layer.kind) ? layer.kind : 'import',
    name: layer.name,
    stemPath: hasStem ? getLayerStemRelativePath(trackId, layer.id) : null,
    sourcePath: hasSource
      ? getLayerSourceRelativePath(trackId, layer.id)
      : null,
    offsetMs: layer.offsetMs,
    durationMs: layer.durationMs,
    muted: layer.muted,
    appliedEffects: Array.isArray(layer.appliedEffects)
      ? (layer.appliedEffects as AppliedEffect[])
      : [],
    peaks: Array.isArray(layer.peaks) ? layer.peaks : null,
    createdAt: layer.createdAt,
    updatedAt: layer.updatedAt,
  };
}

function buildStoredProject(
  track: TrackDetail,
  layers: StoredProjectLayer[],
): StoredAudioProject {
  return {
    version: PROJECT_VERSION,
    id: track.id,
    kind: track.kind,
    status: track.status,
    title: track.title,
    durationMs: track.durationMs,
    mixPath: getRecordingMixdownRelativePath(track.id),
    publishedAt: track.publishedAt,
    createdAt: track.createdAt,
    updatedAt: track.updatedAt,
    selectedLayerId: layers[0]?.id ?? null,
    layers,
  };
}

export async function restoreTrack(trackId: string): Promise<TrackDetail> {
  const track = await getTrack(trackId);

  if (!track.mixUrl) {
    throw new Error('Cloud mix is not available for this track.');
  }

  const mixUri = getRecordingMixdownFileUri(trackId);
  await downloadToFile(track.mixUrl, mixUri);

  const storedLayers: StoredProjectLayer[] = [];

  for (const layer of track.layers) {
    const stemUri = getLayerStemFileUri(trackId, layer.id);
    let hasStem = false;

    if (layer.stemUrl && layer.stemUrl !== track.mixUrl) {
      await downloadToFile(layer.stemUrl, stemUri);
      hasStem = true;
    } else {
      await copyLocalFile(mixUri, stemUri);
      hasStem = true;
    }

    const sourceUri = getLayerSourceFileUri(trackId, layer.id);
    let hasSource = false;
    if (layer.sourceUrl) {
      await downloadToFile(layer.sourceUrl, sourceUri);
      hasSource = true;
    } else if (hasStem) {
      await copyLocalFile(stemUri, sourceUri);
      hasSource = true;
    }

    storedLayers.push(toStoredLayer(trackId, layer, hasStem, hasSource));
  }

  if (storedLayers.length === 0) {
    const syntheticId = trackId;
    const stemUri = getLayerStemFileUri(trackId, syntheticId);
    const sourceUri = getLayerSourceFileUri(trackId, syntheticId);
    await copyLocalFile(mixUri, stemUri);
    await copyLocalFile(mixUri, sourceUri);
    storedLayers.push({
      id: syntheticId,
      sortIndex: 0,
      kind: 'vocal',
      name: 'Vocals',
      stemPath: getLayerStemRelativePath(trackId, syntheticId),
      sourcePath: getLayerSourceRelativePath(trackId, syntheticId),
      offsetMs: 0,
      durationMs: track.durationMs,
      muted: false,
      appliedEffects: [],
      peaks: null,
      createdAt: track.createdAt,
      updatedAt: track.updatedAt,
    });
  }

  const stored = buildStoredProject(track, storedLayers);
  const projectUri = getRecordingProjectFileUri(trackId);
  const parent = new File(projectUri).parentDirectory;
  if (!parent.exists) {
    parent.create({ intermediates: true });
  }
  await writeAsStringAsync(projectUri, JSON.stringify(stored, null, 2));

  return track;
}
