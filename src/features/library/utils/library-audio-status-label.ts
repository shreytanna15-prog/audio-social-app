import type { LibraryAudioItem } from '../types';

/** Publish state wins over storage — synced published tracks are "Published", not "Backed up". */
export function libraryAudioStatusLabel(
  item: Pick<LibraryAudioItem, 'unavailable' | 'status' | 'storageState'>,
): string {
  if (item.unavailable) return 'Unavailable';
  if (item.status === 'PUBLISHED') return 'Published';
  if (item.storageState === 'SYNCED' || item.storageState === 'CLOUD_ONLY') {
    return 'Backed up';
  }
  return 'Draft';
}
