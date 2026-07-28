import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';
import { deleteAsync } from 'expo-file-system/legacy';

import {
  deleteRecordingFiles,
  ensureRecordingsRoot,
  readIndex,
  writeIndex,
} from '@/features/audio/data/recording-storage';
import { normalizeAppliedEffects } from '@/features/audio/domain/effect-definitions';
import {
  optimizeNsSpectralForPreview,
} from '@/features/audio/services/recording-optimize.service';
import type { AppliedEffect } from '@/features/audio/types/applied-effects';
import {
  extensionFromUri,
  getPendingRecordingUri,
  getPendingSourceUri,
  getRecordingFileUri,
  getRecordingRelativePath,
  getRecordingSourceFileUri,
  getRecordingSourceRelativePath,
  PENDING_FOLDER,
} from '@/features/audio/utils/recording-paths';
import type { AudioRecording } from '@/features/audio/types/audio';

type SaveRecordingInput = {
  sourceUri: string;
  durationSeconds: number;
  appliedEffects?: AppliedEffect[];
  /** Pre-soft-gate WAV to persist as source.* when saving. */
  sourcePreGateUri?: string | null;
};

type UpdateRecordingInput = {
  id: string;
  sourceUri: string;
  durationSeconds: number;
  appliedEffects: AppliedEffect[];
  sourcePreGateUri?: string | null;
};

export type StageAudioResult = {
  pendingUri: string;
  sourcePreGateUri: string;
  durationSeconds: number;
};

async function readRecordingBytes(sourceUri: string): Promise<Uint8Array> {
  const source = new File(sourceUri);

  if (source.exists) {
    return source.bytes();
  }

  const response = await fetch(sourceUri);
  if (!response.ok) {
    throw new Error(`Recording file is not accessible: ${sourceUri}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

async function persistRecordingFile(
  sourceUri: string,
  destinationUri: string,
): Promise<void> {
  const destination = new File(destinationUri);
  const parent = destination.parentDirectory;

  if (!parent.exists) {
    parent.create({ intermediates: true });
  }

  const bytes = await readRecordingBytes(sourceUri);
  destination.create({ overwrite: true });
  destination.write(bytes);
}

async function ensureSourceBackup(
  id: string,
  currentOriginalUri: string,
): Promise<void> {
  const extension = extensionFromUri(currentOriginalUri);
  const sourceUri = getRecordingSourceFileUri(id, extension);
  const source = new File(sourceUri);

  if (!source.exists) {
    await persistRecordingFile(currentOriginalUri, sourceUri);
  }
}

async function cleanupTemporarySourceUri(
  sourceUri: string,
  destinationUri: string,
): Promise<void> {
  if (sourceUri === destinationUri) {
    return;
  }

  if (
    !sourceUri.includes('/_processed/') &&
    !sourceUri.includes(PENDING_FOLDER)
  ) {
    return;
  }

  try {
    await deleteAsync(sourceUri, { idempotent: true });
  } catch {
    // Temporary file may already be removed.
  }
}

/**
 * Shared record + import staging: keep pre-gate WAV, soft SpectralGate (mild) → pending.
 */
export async function stageAudioForPreview(
  rawWavUri: string,
  durationSeconds?: number,
): Promise<StageAudioResult> {
  console.warn(
    `[Optimize] stageAudioForPreview ENTER duration=${durationSeconds?.toFixed(2) ?? 'unknown'}s uri=${rawWavUri}`,
  );

  const pendingId = Crypto.randomUUID();
  const sourcePreGateUri = getPendingSourceUri(pendingId);
  const pendingUri = getPendingRecordingUri(pendingId, 'wav');

  await ensureRecordingsRoot();
  await persistRecordingFile(rawWavUri, sourcePreGateUri);

  try {
    console.warn('[Optimize] soft SpectralGate mild → pending');
    const gatedUri = await optimizeNsSpectralForPreview(sourcePreGateUri, pendingUri);
    return {
      pendingUri: gatedUri,
      sourcePreGateUri,
      durationSeconds: durationSeconds ?? 0,
    };
  } catch (error) {
    console.warn('[Optimize] soft SpectralGate failed, using raw capture.', error);
    await persistRecordingFile(sourcePreGateUri, pendingUri);
    return {
      pendingUri,
      sourcePreGateUri,
      durationSeconds: durationSeconds ?? 0,
    };
  }
}

/** @deprecated Use stageAudioForPreview — kept for any stray callers during migration. */
export async function stagePreviewRecording(
  sourceUri: string,
  _mode?: string,
  durationSeconds?: number,
): Promise<string> {
  const result = await stageAudioForPreview(sourceUri, durationSeconds);
  return result.pendingUri;
}

export async function discardPreviewRecording(
  previewUri: string,
  sourcePreGateUri?: string | null,
): Promise<void> {
  if (previewUri.includes(PENDING_FOLDER)) {
    try {
      await deleteAsync(previewUri, { idempotent: true });
    } catch {
      // Pending file may already be moved or deleted.
    }
  }

  if (sourcePreGateUri && sourcePreGateUri.includes(PENDING_FOLDER)) {
    try {
      await deleteAsync(sourcePreGateUri, { idempotent: true });
    } catch {
      // ignore
    }
  }
}

export async function listRecordings(): Promise<AudioRecording[]> {
  const recordings = await readIndex();

  return recordings
    .map((recording) => ({
      ...recording,
      appliedEffects: recording.appliedEffects
        ? normalizeAppliedEffects(recording.appliedEffects)
        : undefined,
    }))
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function saveRecording({
  sourceUri,
  durationSeconds,
  appliedEffects = [],
  sourcePreGateUri,
}: SaveRecordingInput): Promise<AudioRecording> {
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();
  const extension = extensionFromUri(sourceUri);
  const destinationUri = getRecordingFileUri(id, extension);
  const pristineUri = getRecordingSourceFileUri(
    id,
    sourcePreGateUri ? extensionFromUri(sourcePreGateUri) : extension,
  );

  await ensureRecordingsRoot();
  await persistRecordingFile(sourceUri, destinationUri);
  await persistRecordingFile(sourcePreGateUri ?? sourceUri, pristineUri);

  if (
    sourceUri.includes(PENDING_FOLDER) ||
    sourceUri.includes('/_processed/')
  ) {
    try {
      await deleteAsync(sourceUri, { idempotent: true });
    } catch {
      // Temporary file may already be removed.
    }
  }

  if (sourcePreGateUri && sourcePreGateUri.includes(PENDING_FOLDER)) {
    try {
      await deleteAsync(sourcePreGateUri, { idempotent: true });
    } catch {
      // ignore
    }
  }

  const recording: AudioRecording = {
    id,
    uri: destinationUri,
    path: getRecordingRelativePath(id, extension),
    sourcePath: getRecordingSourceRelativePath(
      id,
      sourcePreGateUri ? extensionFromUri(sourcePreGateUri) : extension,
    ),
    type: 'draft',
    duration: durationSeconds,
    appliedEffects: appliedEffects.length > 0 ? appliedEffects : undefined,
    createdAt: now,
    updatedAt: now,
  };

  const index = await readIndex();
  index.unshift(recording);
  await writeIndex(index);

  return recording;
}

export async function updateRecording({
  id,
  sourceUri,
  durationSeconds,
  appliedEffects,
  sourcePreGateUri,
}: UpdateRecordingInput): Promise<AudioRecording> {
  const recordings = await readIndex();
  const existing = recordings.find((item) => item.id === id);

  if (!existing) {
    throw new Error(`Recording not found: ${id}`);
  }

  const extension = extensionFromUri(sourceUri);
  const destinationUri = getRecordingFileUri(id, extension);

  await ensureRecordingsRoot();
  await ensureSourceBackup(id, existing.uri);

  if (sourcePreGateUri) {
    const sourceExt = extensionFromUri(sourcePreGateUri);
    await persistRecordingFile(
      sourcePreGateUri,
      getRecordingSourceFileUri(id, sourceExt),
    );
  }

  if (sourceUri !== destinationUri) {
    await persistRecordingFile(sourceUri, destinationUri);
  }

  await cleanupTemporarySourceUri(sourceUri, destinationUri);

  const now = new Date().toISOString();
  const updated: AudioRecording = {
    ...existing,
    uri: destinationUri,
    path: getRecordingRelativePath(id, extension),
    duration: durationSeconds,
    sourcePath:
      existing.sourcePath ?? getRecordingSourceRelativePath(id, extension),
    appliedEffects: appliedEffects.length > 0 ? appliedEffects : undefined,
    updatedAt: now,
  };

  const nextIndex = recordings.map((item) => (item.id === id ? updated : item));
  await writeIndex(nextIndex);

  return updated;
}

export async function deleteRecording(id: string): Promise<boolean> {
  const recordings = await readIndex();
  const hasRecording = recordings.some((item) => item.id === id);

  if (!hasRecording) {
    return false;
  }

  await deleteRecordingFiles(id);
  await writeIndex(recordings.filter((item) => item.id !== id));

  return true;
}
