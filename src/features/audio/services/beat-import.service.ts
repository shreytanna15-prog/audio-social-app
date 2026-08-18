import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { documentDirectory } from 'expo-file-system/legacy';

import { transcodeToMono48kWav } from '@/features/audio/services/ffmpeg.service';
import { toFileUri } from '@/features/audio/utils/ffmpeg-path';
import { durationSecondsFromMono48kWav } from '@/features/audio/utils/wav-duration';

const ACCEPTED_EXTENSIONS = ['.wav', '.m4a', '.mp3', '.aac', '.aiff', '.aif', '.caf', '.mp4'];

function createBeatTempWavUri(): string {
  if (!documentDirectory) {
    throw new Error('Document directory is not available.');
  }

  const uri = toFileUri(`${documentDirectory}temp/beat-${Date.now()}.wav`);
  const parent = new File(uri).parentDirectory;
  if (!parent.exists) {
    parent.create({ intermediates: true, idempotent: true });
  }
  return uri;
}

function isAcceptedAudio(name: string, mimeType?: string | null): boolean {
  const lowerName = name.toLowerCase();
  if (ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext))) {
    return true;
  }

  return Boolean(mimeType && mimeType.startsWith('audio/'));
}

export type PickedBeat = {
  uri: string;
  name: string;
};

export type ImportedBeat = {
  uri: string;
  durationSeconds: number;
};

/**
 * Opens the file picker only. Kept separate from `prepareBeatFile` so the caller
 * can show progress for the transcode without flashing it behind the picker.
 */
export async function pickBeatFile(): Promise<PickedBeat | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'audio/*',
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];
  if (!isAcceptedAudio(asset.name ?? '', asset.mimeType)) {
    throw new Error('Please choose a WAV, M4A, MP3, or AAC audio file.');
  }

  return { uri: asset.uri, name: asset.name ?? 'Beat' };
}

/** Normalize a picked backing file to mono 48 kHz WAV. No soft-clean. */
export async function prepareBeatFile(sourceUri: string): Promise<ImportedBeat> {
  const tempWavUri = createBeatTempWavUri();
  await transcodeToMono48kWav(sourceUri, tempWavUri);

  return {
    uri: tempWavUri,
    durationSeconds: durationSecondsFromMono48kWav(tempWavUri),
  };
}
