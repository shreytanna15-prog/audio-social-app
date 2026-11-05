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

export function libraryStorageLabel(item: LibraryAudioItem): string {
  if (item.unavailable) {
    return 'Unavailable';
  }
  if (item.storageState === 'SYNCED' || item.storageState === 'CLOUD_ONLY') {
    return item.localUri ? 'Backed up' : 'On cloud';
  }
  if (item.storageState === 'LOCAL_ONLY' && item.localUri) {
    return 'Needs backup';
  }
  if (item.status === 'PUBLISHED') {
    return 'Published';
  }
  return 'Draft';
}
