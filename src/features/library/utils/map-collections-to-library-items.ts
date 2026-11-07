import type { AlbumSummaryDto } from '@/features/albums';
import type { PlaylistSummaryDto } from '@/features/playlists';
import type { SavedAlbumItemDto, SavedPlaylistItemDto } from '@/features/saves';

import type {
  LibraryAlbumItem,
  LibraryPlaylistItem,
  LibrarySavedCollectionItem,
} from '../types';

export function mapPlaylistToLibraryItem(
  dto: PlaylistSummaryDto,
): LibraryPlaylistItem {
  return {
    id: dto.id,
    title: dto.title,
    trackCount: dto.trackCount,
    coverUrl: dto.coverUrl ?? dto.coverFallbackUrls[0] ?? null,
    visibility: dto.visibility === 'PUBLIC' ? 'public' : 'private',
  };
}

export function mapAlbumToLibraryItem(dto: AlbumSummaryDto): LibraryAlbumItem {
  return {
    id: dto.id,
    title: dto.title,
    trackCount: dto.trackCount,
    coverUrl: dto.coverUrl ?? dto.coverFallbackUrl,
    status: dto.status === 'RELEASED' ? 'released' : 'draft',
  };
}

export function mapSavedPlaylistToLibraryItem(
  dto: SavedPlaylistItemDto,
): LibrarySavedCollectionItem {
  const { playlist } = dto;

  return {
    id: playlist.id,
    kind: 'playlist',
    title: playlist.title,
    ownerName: playlist.owner?.name ?? playlist.owner?.username ?? '',
    trackCount: playlist.trackCount ?? 0,
    coverUrl: playlist.coverUrl ?? playlist.coverFallbackUrls?.[0] ?? null,
    available: dto.available,
  };
}

export function mapSavedAlbumToLibraryItem(
  dto: SavedAlbumItemDto,
): LibrarySavedCollectionItem {
  const { album } = dto;

  return {
    id: album.id,
    kind: 'album',
    title: album.title,
    ownerName: album.owner?.name ?? album.owner?.username ?? '',
    trackCount: album.trackCount ?? 0,
    coverUrl: album.coverUrl ?? album.coverFallbackUrl ?? null,
    available: dto.available,
  };
}
