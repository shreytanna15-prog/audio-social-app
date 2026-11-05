import { deleteRecordingFiles } from '@/features/audio/data/recording-storage';

import { deleteTrack as deleteTrackApi } from './service';
import type { CreateTrackResponse } from './types';

export async function deleteTrackFully(
  trackId: string,
): Promise<CreateTrackResponse> {
  const result = await deleteTrackApi(trackId);
  await deleteRecordingFiles(trackId);
  return result;
}
