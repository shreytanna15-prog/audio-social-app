import { fileExists } from '@/features/audio/data/file-persist';
import {
  getLayerStemFileUri,
  getRecordingMixdownFileUri,
} from '@/features/audio/utils/recording-paths';

import {
  completeBackup,
  createBackupUploadUrls,
  uploadToSignedUrl,
} from './service';
import type { BackupCompleteResponse } from './types';

/**
 * Upload local mix (+ stems when present) to Supabase and mark track SYNCED.
 */
export async function backupTrack(
  trackId: string,
  layerIds: string[] = [],
): Promise<BackupCompleteResponse> {
  const mixUri = getRecordingMixdownFileUri(trackId);
  if (!fileExists(mixUri)) {
    throw new Error('Local mix file not found. Cannot backup this track.');
  }

  const urls = await createBackupUploadUrls(trackId);
  await uploadToSignedUrl(urls.uploads.mix.signedUrl, mixUri);

  for (const stem of urls.uploads.stems) {
    const stemUri = getLayerStemFileUri(trackId, stem.layerId);
    if (fileExists(stemUri)) {
      await uploadToSignedUrl(stem.upload.signedUrl, stemUri);
    } else if (layerIds.includes(stem.layerId)) {
      // Stem missing: completeBackup will fall back to mix path for that layer.
    }
  }

  return completeBackup(trackId);
}
