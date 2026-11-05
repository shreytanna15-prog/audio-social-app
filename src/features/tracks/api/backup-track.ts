import { fileExists } from '@/features/audio/data/file-persist';
import {
  getLayerSourceFileUri,
  getLayerStemFileUri,
  getRecordingMixdownFileUri,
} from '@/features/audio/utils/recording-paths';

import {
  abortIncompleteBackup,
  completeBackup,
  createBackupUploadUrls,
  uploadToSignedUrl,
} from './service';
import type { BackupCompleteResponse } from './types';

export async function backupTrack(
  trackId: string,
): Promise<BackupCompleteResponse> {
  const mixUri = getRecordingMixdownFileUri(trackId);
  if (!fileExists(mixUri)) {
    throw new Error('Local mix file not found. Cannot backup this track.');
  }

  let uploadedAnything = false;

  try {
    const urls = await createBackupUploadUrls(trackId);
    await uploadToSignedUrl(urls.uploads.mix.signedUrl, mixUri);
    uploadedAnything = true;

    for (const stem of urls.uploads.stems) {
      const stemUri = getLayerStemFileUri(trackId, stem.layerId);
      if (fileExists(stemUri)) {
        await uploadToSignedUrl(stem.upload.signedUrl, stemUri);
        uploadedAnything = true;
      }
    }

    for (const source of urls.uploads.sources ?? []) {
      const sourceUri = getLayerSourceFileUri(trackId, source.layerId);
      if (fileExists(sourceUri)) {
        await uploadToSignedUrl(source.upload.signedUrl, sourceUri);
        uploadedAnything = true;
      }
    }

    return await completeBackup(trackId);
  } catch (error) {
    if (uploadedAnything) {
      try {
        await abortIncompleteBackup(trackId);
      } catch {
        // keep original backup error
      }
    }
    throw error;
  }
}
