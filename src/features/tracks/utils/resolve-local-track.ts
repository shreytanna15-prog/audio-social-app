import { fileExists } from '@/features/audio/data/file-persist';
import {
  getRecordingMixdownFileUri,
  getRecordingProjectFileUri,
} from '@/features/audio/utils/recording-paths';

export function resolveLocalMixUri(trackId: string): string | null {
  const uri = getRecordingMixdownFileUri(trackId);
  return fileExists(uri) ? uri : null;
}

export function hasLocalProject(trackId: string): boolean {
  return fileExists(getRecordingProjectFileUri(trackId));
}

export function hasLocalTrackFiles(trackId: string): boolean {
  return resolveLocalMixUri(trackId) != null || hasLocalProject(trackId);
}
