import { peakBarCountForDuration } from '@/features/audio/domain/timeline';
import {
  pickBeatFile,
  prepareBeatFile,
  type PickedBeat,
} from '@/features/audio/services/beat-import.service';
import { extractPeaksFromWav } from '@/features/audio/services/peak-extract.service';

export type ImportedDeviceAudio = {
  uri: string;
  durationSeconds: number;
  peaks: number[];
  displayName: string;
};

/** Transcode + peaks for a already-picked file (no soft-clean). */
export async function prepareImportedDeviceAudio(
  picked: PickedBeat,
): Promise<ImportedDeviceAudio> {
  const prepared = await prepareBeatFile(picked.uri);
  const peaks = await extractPeaksFromWav(
    prepared.uri,
    peakBarCountForDuration(prepared.durationSeconds),
  );

  const baseName = picked.name.replace(/\.[^.]+$/, '').trim();

  return {
    uri: prepared.uri,
    durationSeconds: prepared.durationSeconds,
    peaks,
    displayName: baseName || 'Audio 1',
  };
}

/**
 * Pick one device audio file, normalize to mono 48k WAV, extract peaks.
 * Returns null if the user cancels the picker.
 */
export async function importDeviceAudio(): Promise<ImportedDeviceAudio | null> {
  const picked = await pickBeatFile();
  if (!picked) {
    return null;
  }
  return prepareImportedDeviceAudio(picked);
}

export { pickBeatFile };
