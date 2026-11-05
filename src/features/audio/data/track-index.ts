import { resolveDocumentRelativeUri } from '@/features/audio/utils/recording-paths';
import type { TrackKind, TrackRecord, TrackStatus } from '@/features/tracks/types';
import { toTrackListItem } from '@/features/tracks/types';

import type { AudioRecording } from '@/features/audio/types/audio';

export function toTrackRecord(raw: unknown): TrackRecord | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const entry = raw as Record<string, unknown>;
  const id = typeof entry.id === 'string' ? entry.id : null;
  if (!id) {
    return null;
  }

  const now = new Date().toISOString();
  const mixPath =
    (typeof entry.mixPath === 'string' && entry.mixPath) ||
    (typeof entry.path === 'string' && entry.path) ||
    null;

  const kind = normalizeKind(entry.kind);
  const status = normalizeStatus(entry.status, entry.type);
  const title =
    typeof entry.title === 'string' && entry.title.trim()
      ? entry.title.trim()
      : 'Untitled take';

  let durationMs = 0;
  if (typeof entry.durationMs === 'number' && Number.isFinite(entry.durationMs)) {
    durationMs = Math.max(0, Math.round(entry.durationMs));
  } else if (
    typeof entry.duration === 'number' &&
    Number.isFinite(entry.duration)
  ) {
    durationMs = Math.max(0, Math.round(entry.duration * 1000));
  }

  if (!mixPath) {
    return null;
  }

  return {
    id,
    kind,
    status,
    title,
    durationMs,
    mixPath,
    publishedAt:
      typeof entry.publishedAt === 'string' || entry.publishedAt === null
        ? (entry.publishedAt as string | null)
        : status === 'PUBLISHED'
          ? (typeof entry.updatedAt === 'string' ? entry.updatedAt : now)
          : null,
    createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : now,
    updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : now,
  };
}

export function toPersistedTrackRecord(
  track: TrackRecord &
    Partial<
      Pick<
        AudioRecording,
        'projectPath' | 'sourcePath' | 'baselinePath' | 'editChain'
      >
    >,
): TrackRecord &
  Partial<
    Pick<
      AudioRecording,
      'projectPath' | 'sourcePath' | 'baselinePath' | 'editChain'
    >
  > {
  const base: TrackRecord = {
    id: track.id,
    kind: track.kind,
    status: track.status,
    title: track.title,
    durationMs: track.durationMs,
    mixPath: track.mixPath,
    publishedAt: track.publishedAt,
    createdAt: track.createdAt,
    updatedAt: track.updatedAt,
  };

  return {
    ...base,
    ...(track.projectPath ? { projectPath: track.projectPath } : {}),
    ...(track.sourcePath ? { sourcePath: track.sourcePath } : {}),
    ...(track.baselinePath ? { baselinePath: track.baselinePath } : {}),
    ...(track.editChain ? { editChain: track.editChain } : {}),
  };
}

export function hydrateAudioRecording(
  raw: unknown,
  extras?: Partial<
    Pick<
      AudioRecording,
      'projectPath' | 'sourcePath' | 'baselinePath' | 'editChain' | 'appliedEffects'
    >
  >,
): AudioRecording | null {
  const track = toTrackRecord(raw);
  if (!track?.mixPath) {
    return null;
  }

  const mixPath = track.mixPath;
  const entry = (raw && typeof raw === 'object' ? raw : {}) as Record<
    string,
    unknown
  >;

  const uri =
    (typeof entry.uri === 'string' && entry.uri) ||
    resolveDocumentRelativeUri(mixPath) ||
    '';

  if (!uri) {
    return null;
  }

  const projectPath =
    extras?.projectPath ??
    (typeof entry.projectPath === 'string' ? entry.projectPath : undefined);

  return {
    ...track,
    mixPath,
    uri,
    duration: track.durationMs / 1000,
    type: track.status === 'PUBLISHED' ? 'uploaded' : 'draft',
    path: mixPath,
    projectPath,
    sourcePath:
      extras?.sourcePath ??
      (typeof entry.sourcePath === 'string' ? entry.sourcePath : undefined),
    baselinePath:
      extras?.baselinePath ??
      (typeof entry.baselinePath === 'string' ? entry.baselinePath : undefined),
    editChain: extras?.editChain ?? (entry.editChain as AudioRecording['editChain']),
    appliedEffects:
      extras?.appliedEffects ??
      (entry.appliedEffects as AudioRecording['appliedEffects']),
  };
}

export function audioRecordingToListItem(recording: AudioRecording) {
  return toTrackListItem(recording, recording.uri);
}

function normalizeKind(value: unknown): TrackKind {
  if (value === 'MULTI' || value === 'multi') {
    return 'MULTI';
  }
  if (value === 'SINGLE' || value === 'single') {
    return 'SINGLE';
  }
  return 'SINGLE';
}

function normalizeStatus(status: unknown, legacyType: unknown): TrackStatus {
  if (status === 'PUBLISHED' || status === 'DRAFT') {
    return status;
  }
  if (legacyType === 'uploaded') {
    return 'PUBLISHED';
  }
  return 'DRAFT';
}
