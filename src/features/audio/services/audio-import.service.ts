import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { documentDirectory } from 'expo-file-system/legacy';

import { stageAudioForPreview, type StageAudioResult } from '@/features/audio/data/recording-repository';
import { transcodeToMono48kWav } from '@/features/audio/services/ffmpeg.service';
import { toFileUri } from '@/features/audio/utils/ffmpeg-path';
import { durationSecondsFromMono48kWav } from '@/features/audio/utils/wav-duration';

const ACCEPTED_EXTENSIONS = ['.wav', '.m4a', '.mp3', '.aac', '.aiff', '.aif', '.caf', '.mp4'];

function createImportTempWavUri(): string {
  if (!documentDirectory) {
    throw new Error('Document directory is not available.');
  }

  const uri = toFileUri(`${documentDirectory}temp/import-${Date.now()}.wav`);
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

export type PickedAudio = {
  uri: string;
  name: string;
};

/**
 * Opens the file picker only. Split from `prepareImportedAudio` so callers can
 * show progress for the decode without flashing a spinner behind the picker.
 */
export async function pickAudioFile(): Promise<PickedAudio | null> {
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

  return { uri: asset.uri, name: asset.name ?? 'Audio' };
}

/** Normalize a picked file to mono 48 kHz WAV, then soft-gate it into pending. */
export async function prepareImportedAudio(
  sourceUri: string,
): Promise<StageAudioResult> {
  const tempWavUri = createImportTempWavUri();
  await transcodeToMono48kWav(sourceUri, tempWavUri);

  const durationSeconds = durationSecondsFromMono48kWav(tempWavUri);
  const staged = await stageAudioForPreview(tempWavUri, durationSeconds);

  try {
    const temp = new File(tempWavUri);
    if (temp.exists) {
      temp.delete();
    }
  } catch {
    // ignore
  }

  return staged;
}

/** Pick an audio file, normalize to mono 48 kHz WAV, soft-gate into pending. */
export async function importAudioForPreview(): Promise<StageAudioResult | null> {
  const picked = await pickAudioFile();

  if (!picked) {
    return null;
  }

  return prepareImportedAudio(picked.uri);
}
