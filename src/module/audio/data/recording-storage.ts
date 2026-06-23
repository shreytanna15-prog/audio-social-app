import {
  deleteAsync,
  makeDirectoryAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';

import {
  getIndexPath,
  getPendingDirectory,
  getRecordingDirectory,
  getRecordingsRoot,
} from '@/module/audio/data/recording-paths';
import type { AudioRecording } from '@/types/audio';

export async function ensureRecordingsRoot(): Promise<void> {
  const root = getRecordingsRoot();
  await makeDirectoryAsync(root, { intermediates: true });
  await makeDirectoryAsync(getPendingDirectory(), { intermediates: true });
}

export async function readIndex(): Promise<AudioRecording[]> {
  await ensureRecordingsRoot();

  try {
    const contents = await readAsStringAsync(getIndexPath());
    const parsed = JSON.parse(contents) as AudioRecording[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

export async function writeIndex(recordings: AudioRecording[]): Promise<void> {
  await ensureRecordingsRoot();
  await writeAsStringAsync(getIndexPath(), JSON.stringify(recordings, null, 2));
}

export async function deleteRecordingFiles(id: string): Promise<void> {
  try {
    await deleteAsync(getRecordingDirectory(id), { idempotent: true });
  } catch {
    // Recording directory may already be removed.
  }
}
