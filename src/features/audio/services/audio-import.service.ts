import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { documentDirectory } from 'expo-file-system/legacy';

import { stageAudioForPreview, type StageAudioResult } from '@/features/audio/data/recording-repository';
import { transcodeToMono48kWav } from '@/features/audio/services/ffmpeg.service';
import { toFileUri } from '@/features/audio/utils/ffmpeg-path';

const ACCEPTED_EXTENSIONS = ['.wav', '.m4a', '.mp3', '.aac', '.aiff', '.aif', '.caf', '.mp4'];
const WAV_SAMPLE_RATE = 48_000;
const WAV_BYTES_PER_SAMPLE = 2;
const WAV_CHANNELS = 1;
const WAV_HEADER_BYTES = 44;

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

function durationSecondsFromMono48kWav(uri: string): number {
  const file = new File(uri);
  if (!file.exists) {
    return 0;
  }

  const size = file.size;
  if (!Number.isFinite(size) || size <= WAV_HEADER_BYTES) {
    return 0;
  }

  const pcmBytes = size - WAV_HEADER_BYTES;
  const frameBytes = WAV_SAMPLE_RATE * WAV_CHANNELS * WAV_BYTES_PER_SAMPLE;
  return Math.max(0, pcmBytes / frameBytes);
}

/**
 * Pick an audio file, normalize to mono 48 kHz WAV, soft-gate into pending.
 */
export async function importAudioForPreview(): Promise<StageAudioResult | null> {
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

  const tempWavUri = createImportTempWavUri();
  console.warn(`[Import] picked name=${asset.name} uri=${asset.uri}`);

  await transcodeToMono48kWav(asset.uri, tempWavUri);

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
