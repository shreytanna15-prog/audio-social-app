import * as Crypto from 'expo-crypto';

import { isApiError } from '@/core/api/errors';
import {
  saveProject,
  updateProject,
} from '@/features/audio/data/project-repository';
import { projectDurationSeconds } from '@/features/audio/domain/project';
import type { AudioProject } from '@/features/audio/types/project';
import type { AudioRecording } from '@/features/audio/types/audio';
import { hasLocalProject } from '@/features/tracks/utils/resolve-local-track';

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
  trackId?: string;
  updateExisting?: boolean;
};

export type SaveTrackDraftError = Error & { trackId: string };

function toLayerRequests(project: AudioProject): CreateTrackLayerRequest[] {
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
      appliedEffects: [],
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
    Math.round(projectDurationSeconds(input.project) * 1000),
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
  };
}

function isConflictError(error: unknown): boolean {
  return (
    isApiError(error) &&
    (error.status === 409 || error.code === 'CONFLICT')
  );
}

function attachTrackId(error: unknown, trackId: string): SaveTrackDraftError {
  if (error instanceof Error) {
    const next = error as SaveTrackDraftError;
    next.trackId = trackId;
    return next;
  }
  const next = new Error(
    typeof error === 'string' ? error : 'Save failed',
  ) as SaveTrackDraftError;
  next.trackId = trackId;
  return next;
}

export function getSaveTrackDraftTrackId(error: unknown): string | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'trackId' in error &&
    typeof (error as { trackId: unknown }).trackId === 'string'
  ) {
    return (error as { trackId: string }).trackId;
  }
  return null;
}

export async function saveTrackDraft(
  input: SaveTrackDraftInput,
): Promise<AudioRecording> {
  const trackId = input.trackId ?? Crypto.randomUUID();
  const updateExisting = input.updateExisting === true;
  const localExists = hasLocalProject(trackId);

  const recording = localExists
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
  const patchBody = {
    title: body.title,
    durationMs: body.durationMs,
    layers: body.layers,
  };

  try {
    if (updateExisting) {
      await updateTrack(trackId, patchBody);
    } else {
      try {
        await createTrack(body);
      } catch (error) {
        if (isConflictError(error)) {
          await updateTrack(trackId, patchBody);
        } else {
          throw attachTrackId(error, trackId);
        }
      }
    }
  } catch (error) {
    if (
      isApiError(error) &&
      error.status === 404 &&
      updateExisting
    ) {
      try {
        await createTrack(body);
        return recording;
      } catch (createError) {
        if (isConflictError(createError)) {
          await updateTrack(trackId, patchBody);
          return recording;
        }
        throw attachTrackId(createError, trackId);
      }
    }
    throw attachTrackId(error, trackId);
  }

  return recording;
}
