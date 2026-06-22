import { documentDirectory } from 'expo-file-system/legacy';

const RECORDINGS_FOLDER = 'recordings';
const INDEX_FILE = 'index.json';
const ORIGINAL_FILE = 'original.m4a';

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

const PENDING_FOLDER = '_pending';

export function getPendingDirectory(): string {
  return `${getRecordingsRoot()}${PENDING_FOLDER}/`;
}

export function getPendingRecordingUri(pendingId: string): string {
  return `${getPendingDirectory()}${pendingId}.m4a`;
}
