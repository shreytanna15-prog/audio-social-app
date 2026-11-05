import {
  deleteAsync,
  makeDirectoryAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';

import {
  hydrateAudioRecording,
  toPersistedTrackRecord,
} from '@/features/audio/data/track-index';
import type { AudioRecording } from '@/features/audio/types/audio';
import {
  getIndexPath,
  getPendingDirectory,
  getRecordingDirectory,
  getRecordingsRoot,
} from '@/features/audio/utils/recording-paths';

export async function ensureRecordingsRoot(): Promise<void> {
  const root = getRecordingsRoot();
  await makeDirectoryAsync(root, { intermediates: true });
  await makeDirectoryAsync(getPendingDirectory(), { intermediates: true });
}

export async function readIndex(): Promise<AudioRecording[]> {
  await ensureRecordingsRoot();

  try {
    const contents = await readAsStringAsync(getIndexPath());
    const parsed = JSON.parse(contents) as unknown[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((entry) => hydrateAudioRecording(entry))
      .filter((entry): entry is AudioRecording => entry != null);
  } catch {
    return [];
  }
}

export async function writeIndex(recordings: AudioRecording[]): Promise<void> {
  await ensureRecordingsRoot();
  const persisted = recordings.map((recording) =>
    toPersistedTrackRecord(recording),
  );
  await writeAsStringAsync(getIndexPath(), JSON.stringify(persisted, null, 2));
}

export async function deleteRecordingFiles(id: string): Promise<void> {
  try {
    await deleteAsync(getRecordingDirectory(id), { idempotent: true });
  } catch {
    // Recording directory may already be removed.
  }
}
