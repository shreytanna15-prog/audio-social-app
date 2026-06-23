import { documentDirectory } from 'expo-file-system/legacy';

import type { AudioRecording } from '@/types/audio';

const RECORDINGS_FOLDER = 'recordings';
const INDEX_FILE = 'index.json';
const ORIGINAL_FILE = 'original.m4a';
const SOURCE_FILE = 'source.m4a';

function requireDocumentDirectory(): string {
  if (!documentDirectory) {
    throw new Error('Document directory is not available on this platform.');
  }

  return documentDirectory;
}

export function getRecordingsRoot(): string {
  return `${requireDocumentDirectory()}${RECORDINGS_FOLDER}/`;
}

export function getIndexPath(): string {
  return `${getRecordingsRoot()}${INDEX_FILE}`;
}

export function getRecordingDirectory(id: string): string {
  return `${getRecordingsRoot()}${id}/`;
}

export function getRecordingFileUri(id: string): string {
  return `${getRecordingDirectory(id)}${ORIGINAL_FILE}`;
}

export function getRecordingRelativePath(id: string): string {
  return `${RECORDINGS_FOLDER}/${id}/${ORIGINAL_FILE}`;
}

export function getRecordingSourceFileUri(id: string): string {
  return `${getRecordingDirectory(id)}${SOURCE_FILE}`;
}

export function getRecordingSourceRelativePath(id: string): string {
  return `${RECORDINGS_FOLDER}/${id}/${SOURCE_FILE}`;
}

export function resolvePristineRecordingUri(
  recording: Pick<AudioRecording, 'uri' | 'sourcePath'>,
): string {
  if (recording.sourcePath && documentDirectory) {
    return `${documentDirectory}${recording.sourcePath}`;
  }

  return recording.uri;
}

const PENDING_FOLDER = '_pending';

export function getPendingDirectory(): string {
  return `${getRecordingsRoot()}${PENDING_FOLDER}/`;
}

export function getPendingRecordingUri(pendingId: string): string {
  return `${getPendingDirectory()}${pendingId}.m4a`;
}

const PROCESSED_FOLDER = '_processed';

export function getProcessedDirectory(): string {
  return `${getPendingDirectory()}${PROCESSED_FOLDER}/`;
}

export function getProcessedRecordingUri(effectId: string, fileId: string): string {
  return `${getProcessedDirectory()}${fileId}-${effectId}.m4a`;
}
