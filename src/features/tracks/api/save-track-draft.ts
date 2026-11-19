import * as Crypto from 'expo-crypto';

import {
  saveProject,
  updateProject,
} from '@/features/audio/data/project-repository';
import {
  hasMixableContent,
  mixDurationSeconds,
} from '@/features/audio/domain/project';
import type { AudioProject } from '@/features/audio/types/project';
import type { AudioRecording } from '@/features/audio/types/audio';

import { encodeLayerFxMeta } from '../utils/layer-fx-meta';
import { createTrack, updateTrack } from './service';
import type {
  CreateTrackLayerRequest,
  CreateTrackRequest,
  TrackKind,
} from './types';

export type SaveTrackDraftInput = {
  project: AudioProject;
  kind: TrackKind;
  title: string;
  mixdownUri?: string | null;
  /** When set, updates an existing DRAFT instead of creating. */
  trackId?: string;
  /** When creating, optionally attach the new track to this project. */
  projectId?: string;
};

function toLayerRequests(project: AudioProject): CreateTrackLayerRequest[] {
  // Keep muted layers in metadata (reopen / unmute); empty slots stay local-only.
  return project.layers
    .filter((layer) => Boolean(layer.stemUri))
    .map((layer, index) => ({
      id: layer.id,
      kind: layer.kind,
      name: layer.name || `Layer ${index + 1}`,
      durationMs: Math.max(0, Math.round(layer.durationSeconds * 1000)),
      offsetMs: layer.offsetMs,
      muted: layer.muted,
      sortIndex: index,
      appliedEffects: encodeLayerFxMeta({
        editChain: layer.editChain,
        captureFx: layer.captureFx,
      }),
      peaks: layer.peaks.length > 0 ? layer.peaks : undefined,
    }));
}

function toCreateBody(
  trackId: string,
  input: SaveTrackDraftInput,
  layers: CreateTrackLayerRequest[],
): CreateTrackRequest {
  const durationMs = Math.max(
    0,
    Math.round(mixDurationSeconds(input.project) * 1000),
  );

  return {
    id: trackId,
    kind: input.kind,
    title: input.title.trim() || 'Untitled take',
    durationMs,
    layers:
      layers.length > 0
        ? layers
        : [
            {
              id: Crypto.randomUUID(),
              kind: 'vocal',
              name: 'Vocals',
              durationMs,
              offsetMs: 0,
              muted: false,
              sortIndex: 0,
              appliedEffects: [],
            },
          ],
    ...(input.projectId ? { projectId: input.projectId } : {}),
  };
}

/**
 * Files first under recordings/{trackId}/, then POST/PATCH draft metadata.
 * On API failure local files are kept for retry.
 */
export async function saveTrackDraft(
  input: SaveTrackDraftInput,
): Promise<AudioRecording> {
  if (!hasMixableContent(input.project)) {
    throw new Error(
      'Nothing to save. Add or unmute at least one audio layer first.',
    );
  }

  const isUpdate = Boolean(input.trackId);
  const trackId = input.trackId ?? Crypto.randomUUID();

  const recording = isUpdate
    ? await updateProject({
        id: trackId,
        project: input.project,
        mixdownUri: input.mixdownUri,
        title: input.title,
        kind: input.kind,
        skipIndex: true,
      })
    : await saveProject({
        id: trackId,
        project: input.project,
        mixdownUri: input.mixdownUri,
        title: input.title,
        kind: input.kind,
        skipIndex: true,
      });

  const layers = toLayerRequests(input.project);
  const body = toCreateBody(trackId, input, layers);

  if (isUpdate) {
    await updateTrack(trackId, {
      title: body.title,
      durationMs: body.durationMs,
      layers: body.layers,
    });
  } else {
    await createTrack(body);
  }

  return recording;
}
