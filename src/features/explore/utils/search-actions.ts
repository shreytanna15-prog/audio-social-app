import type { AlbumDetailDto } from '@/features/albums';
import type { PlayerTrack } from '@/features/player';
import type { PlaylistDetailDto } from '@/features/playlists';
import type {
  MusicSearchItem,
  RecordSearchRecentRequest,
} from '@/features/search';

export function musicResultToPlayerTrack(item: MusicSearchItem): PlayerTrack | null {
  if (item.type === 'song') {
    if (!item.mixUrl) return null;
    return {
      id: item.id,
      title: item.title,
      artist: item.subtitle,
      coverUrl: item.coverUrl ?? '',
      mixUrl: item.mixUrl,
    };
  }

  const track = item.firstTrack;
  if (!track?.mixUrl) return null;
  return {
    id: track.id,
    title: track.title,
    artist: track.artistName,
    coverUrl: track.coverUrl ?? item.coverUrl ?? '',
    mixUrl: track.mixUrl,
  };
}

export function collectionToPlayerTrack(
  collection: PlaylistDetailDto | AlbumDetailDto,
): PlayerTrack | null {
  const track = collection.tracks.find((row) => row.available && row.mixUrl);
  if (!track?.mixUrl) return null;
  return {
    id: track.id,
    title: track.title,
    artist: track.artist?.name?.trim() || track.artist?.username || 'Unknown artist',
    coverUrl: track.coverUrl ?? collection.coverUrl ?? '',
    mixUrl: track.mixUrl,
  };
}

export function musicRecentRequest(
  item: MusicSearchItem,
  query?: string,
): RecordSearchRecentRequest {
  const trimmed = query?.trim().slice(0, 100);
  return {
    kind: item.type === 'song' ? 'SONG' : item.type === 'album' ? 'ALBUM' : 'PLAYLIST',
    targetId: item.id,
    title: item.title,
    subtitle: item.subtitle,
    ...(item.coverUrl && item.coverUrl.length <= 2048
      ? { coverUrl: item.coverUrl }
      : {}),
    ...(trimmed ? { query: trimmed } : {}),
  };
}
