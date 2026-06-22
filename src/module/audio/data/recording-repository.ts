import { File } from 'expo-file-system';
import { deleteAsync } from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';

import {
  getPendingRecordingUri,
  getRecordingFileUri,
  getRecordingRelativePath,
} from '@/module/audio/data/recording-paths';
import {
  ensureRecordingsRoot,
  readIndex,
  writeIndex,
} from '@/module/audio/data/recording-storage';
import type { AudioRecording } from '@/types/audio';

type SaveRecordingInput = {
  sourceUri: string;
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

async function persistRecordingFile(sourceUri: string, destinationUri: string): Promise<void> {
  const destination = new File(destinationUri);
  const parent = destination.parentDirectory;

  if (!parent.exists) {
    parent.create({ intermediates: true });
  }

  const bytes = await readRecordingBytes(sourceUri);
  destination.create({ overwrite: true });
  destination.write(bytes);
}

export async function stagePreviewRecording(sourceUri: string): Promise<string> {
  const pendingUri = getPendingRecordingUri(Crypto.randomUUID());

  await ensureRecordingsRoot();
  await persistRecordingFile(sourceUri, pendingUri);

  return pendingUri;
}

export async function discardPreviewRecording(previewUri: string): Promise<void> {
  if (!previewUri.includes('/_pending/')) {
    return;
  }

  try {
    await deleteAsync(previewUri, { idempotent: true });
  } catch {
    // Pending file may already be moved or deleted.
  }
}

export async function listRecordings(): Promise<AudioRecording[]> {
  const recordings = await readIndex();

  return recordings.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function saveRecording({
  sourceUri,
  durationSeconds,
}: SaveRecordingInput): Promise<AudioRecording> {
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();
  const destinationUri = getRecordingFileUri(id);

  await ensureRecordingsRoot();
  await persistRecordingFile(sourceUri, destinationUri);

  if (sourceUri.includes('/_pending/')) {
    try {
      await deleteAsync(sourceUri, { idempotent: true });
    } catch {
      // Pending file may already be removed.
    }
  }

  const recording: AudioRecording = {
    id,
    uri: destinationUri,
    path: getRecordingRelativePath(id),
    type: 'draft',
    duration: durationSeconds,
    createdAt: now,
    updatedAt: now,
  };

  const index = await readIndex();
  index.unshift(recording);
  await writeIndex(index);

  return recording;
}
