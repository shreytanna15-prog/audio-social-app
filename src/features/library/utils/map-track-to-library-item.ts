import type { TrackListItem } from '@/features/tracks';
import {
  hasLocalTrackFiles,
  resolveLocalMixUri,
} from '@/features/tracks/utils/resolve-local-track';

import type { LibraryAudioItem } from '../types';

export function mapTrackToLibraryItem(track: TrackListItem): LibraryAudioItem {
  const localUri = resolveLocalMixUri(track.id);
  const hasLocal = hasLocalTrackFiles(track.id);
  const hasCloud = Boolean(track.mixUrl);
  const unavailable =
    track.storageState === 'LOCAL_ONLY' && !hasLocal && !hasCloud;

  return {
    ...track,
    storageState: track.storageState ?? 'LOCAL_ONLY',
    localUri,
    unavailable,
  };
}
