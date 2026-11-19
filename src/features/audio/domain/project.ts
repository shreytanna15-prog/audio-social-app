import * as Crypto from 'expo-crypto';

import { normalizeStoredEditChain } from '@/features/audio/domain/edit-chain-persistence';
import type { AudioRecording } from '@/features/audio/types/audio';
import {
  MAX_PROJECT_LAYERS,
  PROJECT_VERSION,
  type AudioProject,
  type ProjectLayer,
  type ProjectLayerKind,
} from '@/features/audio/types/project';
import {
  resolveBaselineRecordingUri,
  resolvePristineRecordingUri,
} from '@/features/audio/utils/recording-paths';

export function createEmptyProject(): AudioProject {
  return {
    version: PROJECT_VERSION,
    layers: [],
    selectedLayerId: null,
  };
}

export function createLayerId(): string {
  return Crypto.randomUUID();
}

export function nextLayerName(layers: ProjectLayer[], kind: ProjectLayerKind): string {
  if (kind === 'beat') {
    const count = layers.filter((layer) => layer.kind === 'beat').length + 1;
    return count === 1 ? 'Beat' : `Beat ${count}`;
  }

  if (kind === 'import') {
    const count = layers.filter((layer) => layer.kind === 'import').length + 1;
    return count === 1 ? 'Audio 1' : `Audio ${count}`;
  }

  const count = layers.filter((layer) => layer.kind === 'vocal').length + 1;
  return `Vocals ${count}`;
}

export function createLayer(input: {
  kind: ProjectLayerKind;
  name: string;
  stemUri?: string | null;
  baselineUri?: string | null;
  sourceUri?: string | null;
  durationSeconds?: number;
  peaks?: number[];
}): ProjectLayer {
  return {
    id: createLayerId(),
    kind: input.kind,
    name: input.name,
    stemUri: input.stemUri ?? null,
    baselineUri: input.baselineUri ?? null,
    sourceUri: input.sourceUri ?? null,
    muted: false,
    offsetMs: 0,
    durationSeconds: input.durationSeconds ?? 0,
    peaks: input.peaks ?? [],
  };
}

export function canAddLayer(layers: ProjectLayer[]): boolean {
  return layers.length < MAX_PROJECT_LAYERS;
}

export function layerEndSeconds(layer: ProjectLayer): number {
  return layer.offsetMs / 1000 + layer.durationSeconds;
}

export function projectDurationSeconds(project: AudioProject): number {
  return project.layers.reduce(
    (max, layer) => Math.max(max, layerEndSeconds(layer)),
    0,
  );
}

/** Mix / publish length — muted and empty layers do not extend the final audio. */
export function mixDurationSeconds(project: AudioProject): number {
  return project.layers.reduce((max, layer) => {
    if (layer.muted || !layer.stemUri) {
      return max;
    }
    return Math.max(max, layerEndSeconds(layer));
  }, 0);
}

export type MixInput = {
  uri: string;
  delayMs: number;
};

export function unmutedMixInputs(project: AudioProject): MixInput[] {
  return project.layers
    .filter((layer) => !layer.muted && layer.stemUri)
    .map((layer) => ({
      uri: layer.stemUri as string,
      delayMs: Math.max(0, Math.round(layer.offsetMs)),
    }));
}

export function unmutedStems(project: AudioProject): string[] {
  return unmutedMixInputs(project).map((input) => input.uri);
}

export function selectedLayer(project: AudioProject): ProjectLayer | null {
  if (!project.selectedLayerId) {
    return project.layers[0] ?? null;
  }

  return (
    project.layers.find((layer) => layer.id === project.selectedLayerId) ??
    project.layers[0] ??
    null
  );
}

export function wrapLegacyRecording(recording: AudioRecording): AudioProject {
  const stemUri = recording.uri;
  const baselineUri = resolveBaselineRecordingUri(recording) ?? recording.uri;
  const sourceUri = resolvePristineRecordingUri(recording);

  const layer: ProjectLayer = {
    id: `legacy-${recording.id}`,
    kind: 'vocal',
    name: 'Vocals 1',
    stemUri,
    baselineUri,
    sourceUri,
    editChain: normalizeStoredEditChain(recording.editChain),
    muted: false,
    offsetMs: 0,
    durationSeconds: recording.duration,
    peaks: [],
  };

  return {
    version: PROJECT_VERSION,
    layers: [layer],
    selectedLayerId: layer.id,
  };
}

export function createImportLayerProject(input: {
  stemUri: string;
  sourceUri: string;
  durationSeconds: number;
  peaks?: number[];
  name?: string;
}): AudioProject {
  const layer = createLayer({
    kind: 'import',
    name: input.name?.trim() || 'Audio 1',
    stemUri: input.stemUri,
    baselineUri: input.stemUri,
    sourceUri: input.sourceUri,
    durationSeconds: input.durationSeconds,
    peaks: input.peaks,
  });

  return {
    version: PROJECT_VERSION,
    layers: [layer],
    selectedLayerId: layer.id,
  };
}

export function hasRecordableContent(project: AudioProject): boolean {
  return project.layers.some((layer) => layer.stemUri != null);
}

/** At least one unmuted stem — required to build a mix for save / publish. */
export function hasMixableContent(project: AudioProject): boolean {
  return project.layers.some((layer) => !layer.muted && layer.stemUri != null);
}
