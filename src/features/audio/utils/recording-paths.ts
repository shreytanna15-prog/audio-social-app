import { documentDirectory } from 'expo-file-system/legacy';

import type { AudioRecording } from '@/features/audio/types/audio';

const RECORDINGS_FOLDER = 'recordings';
const INDEX_FILE = 'index.json';
export const PENDING_FOLDER = '_pending';

export type RecordingAudioExtension = 'mp3' | 'wav' | 'm4a';

function requireDocumentDirectory(): string {
  if (!documentDirectory) {
    throw new Error('Document directory is not available on this platform.');
  }

  return documentDirectory;
}

export function extensionFromUri(uri: string): RecordingAudioExtension {
  const lower = uri.toLowerCase().split('?')[0] ?? uri.toLowerCase();

  if (lower.endsWith('.wav')) {
    return 'wav';
  }

  if (lower.endsWith('.m4a') || lower.endsWith('.mp4') || lower.endsWith('.aac')) {
    return 'm4a';
  }

  return 'mp3';
}

function originalFileName(extension: RecordingAudioExtension): string {
  return `original.${extension}`;
}

function sourceFileName(extension: RecordingAudioExtension): string {
  return `source.${extension}`;
}

function baselineFileName(extension: RecordingAudioExtension = 'wav'): string {
  return `baseline.${extension}`;
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

export function getRecordingFileUri(
  id: string,
  extension: RecordingAudioExtension = 'mp3',
): string {
  return `${getRecordingDirectory(id)}${originalFileName(extension)}`;
}

export function getRecordingRelativePath(
  id: string,
  extension: RecordingAudioExtension = 'mp3',
): string {
  return `${RECORDINGS_FOLDER}/${id}/${originalFileName(extension)}`;
}

export function getRecordingSourceFileUri(
  id: string,
  extension: RecordingAudioExtension = 'mp3',
): string {
  return `${getRecordingDirectory(id)}${sourceFileName(extension)}`;
}

export function getRecordingSourceRelativePath(
  id: string,
  extension: RecordingAudioExtension = 'mp3',
): string {
  return `${RECORDINGS_FOLDER}/${id}/${sourceFileName(extension)}`;
}

export function getRecordingBaselineFileUri(
  id: string,
  extension: RecordingAudioExtension = 'wav',
): string {
  return `${getRecordingDirectory(id)}${baselineFileName(extension)}`;
}

export function getRecordingBaselineRelativePath(
  id: string,
  extension: RecordingAudioExtension = 'wav',
): string {
  return `${RECORDINGS_FOLDER}/${id}/${baselineFileName(extension)}`;
}

export function resolveBaselineRecordingUri(
  recording: Pick<AudioRecording, 'uri' | 'baselinePath'>,
): string | null {
  if (recording.baselinePath && documentDirectory) {
    return `${documentDirectory}${recording.baselinePath}`;
  }

  return null;
}

/** Pre-gate pristine WAV used as Clean Voice input. */
export function resolvePristineRecordingUri(
  recording: Pick<AudioRecording, 'uri' | 'sourcePath'>,
): string {
  if (recording.sourcePath && documentDirectory) {
    return `${documentDirectory}${recording.sourcePath}`;
  }

  return recording.uri;
}

export function getPendingDirectory(): string {
  return `${getRecordingsRoot()}${PENDING_FOLDER}/`;
}

export function getPendingRecordingUri(
  pendingId: string,
  extension: RecordingAudioExtension = 'mp3',
): string {
  return `${getPendingDirectory()}${pendingId}.${extension}`;
}

/** Pre-soft-gate WAV kept alongside pending for Clean Voice + save source backup. */
export function getPendingSourceUri(pendingId: string): string {
  return `${getPendingDirectory()}${pendingId}-source.wav`;
}

const PROCESSED_FOLDER = '_processed';
const PROJECT_FILE = 'project.json';
const MIXDOWN_FILE = 'mixdown.wav';

export function getProcessedDirectory(): string {
  return `${getPendingDirectory()}${PROCESSED_FOLDER}/`;
}

export function getProcessedRecordingUri(effectId: string, fileId: string): string {
  return `${getProcessedDirectory()}${fileId}-${effectId}.wav`;
}

export function getRecordingProjectFileUri(id: string): string {
  return `${getRecordingDirectory(id)}${PROJECT_FILE}`;
}

export function getRecordingProjectRelativePath(id: string): string {
  return `${RECORDINGS_FOLDER}/${id}/${PROJECT_FILE}`;
}

export function getRecordingMixdownFileUri(id: string): string {
  return `${getRecordingDirectory(id)}${MIXDOWN_FILE}`;
}

export function getRecordingMixdownRelativePath(id: string): string {
  return `${RECORDINGS_FOLDER}/${id}/${MIXDOWN_FILE}`;
}

export function getLayerDirectory(recordingId: string, layerId: string): string {
  return `${getRecordingDirectory(recordingId)}layers/${layerId}/`;
}

export function getLayerStemFileUri(recordingId: string, layerId: string): string {
  return `${getLayerDirectory(recordingId, layerId)}stem.wav`;
}

export function getLayerBaselineFileUri(recordingId: string, layerId: string): string {
  return `${getLayerDirectory(recordingId, layerId)}baseline.wav`;
}

export function getLayerSourceFileUri(recordingId: string, layerId: string): string {
  return `${getLayerDirectory(recordingId, layerId)}source.wav`;
}

export function getLayerStemRelativePath(recordingId: string, layerId: string): string {
  return `${RECORDINGS_FOLDER}/${recordingId}/layers/${layerId}/stem.wav`;
}

export function getLayerBaselineRelativePath(recordingId: string, layerId: string): string {
  return `${RECORDINGS_FOLDER}/${recordingId}/layers/${layerId}/baseline.wav`;
}

export function getLayerSourceRelativePath(recordingId: string, layerId: string): string {
  return `${RECORDINGS_FOLDER}/${recordingId}/layers/${layerId}/source.wav`;
}

export function getPendingProjectMixdownUri(pendingId: string): string {
  return `${getPendingDirectory()}mix-${pendingId}.wav`;
}

export function resolveDocumentRelativeUri(relativePath: string | null | undefined): string | null {
  if (!relativePath || !documentDirectory) {
    return null;
  }

  return `${documentDirectory}${relativePath}`;
}
