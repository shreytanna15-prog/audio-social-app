import type { LikedTrackItemDto } from '@/features/saves';

import type { LibraryLikedTrackItem } from '../types';

export function mapLikedTrackToLibraryItem(
  dto: LikedTrackItemDto,
): LibraryLikedTrackItem | null {
  if (!dto.track) return null;

  const { track } = dto;
  const artist = track.artist;

  return {
    id: track.id,
    title: track.title,
    artist: artist ? (artist.name ?? artist.username) : '',
    artistAvatarUrl: artist?.avatarUrl ?? undefined,
    coverUrl: track.coverUrl ?? null,
    durationSec:
      track.durationMs != null ? Math.round(track.durationMs / 1000) : undefined,
    likeCount: track.likeCount ?? 0,
    likedAt: dto.likedAt,
    available: dto.available,
  };
}
