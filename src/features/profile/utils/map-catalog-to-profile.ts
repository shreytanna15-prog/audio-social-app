import type { AlbumSummaryDto } from '@/features/albums';
import type { PlaylistSummaryDto } from '@/features/playlists';
import type { PublishedTrackItem } from '@/features/tracks';

import type { ProfileAlbum, ProfileFeaturedSong, ProfilePlaylist, ProfileTrack } from '../types';
import { formatCountLabel } from './format-count-label';

function formatDurationLabel(durationMs: number): string {
  const totalSec = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function mapPublishedTrackToProfileTrack(
  track: PublishedTrackItem,
): ProfileTrack {
  return {
    id: track.id,
    title: track.title,
    coverUrl: track.coverUrl ?? '',
    durationLabel: formatDurationLabel(track.durationMs),
    playsLabel: formatCountLabel(track.playCount),
    durationSec: Math.max(1, Math.round(track.durationMs / 1000)),
  };
}

export function mapPublishedTracksToFeaturedSong(
  tracks: PublishedTrackItem[],
  artistName: string,
  fallbackCover: string,
): ProfileFeaturedSong {
  const first = tracks[0];
  if (!first) {
    return {
      id: 'featured-empty',
      title: 'No featured song yet',
      artistName,
      durationLabel: '0:00',
      playsLabel: formatCountLabel(0),
      coverUrl: fallbackCover,
      qualityBadge: '',
      formatLabel: '',
    };
  }

  return {
    id: first.id,
    title: first.title,
    artistName,
    durationLabel: formatDurationLabel(first.durationMs),
    playsLabel: formatCountLabel(first.playCount),
    coverUrl: first.coverUrl ?? fallbackCover,
    qualityBadge: '',
    formatLabel: '',
    durationSec: Math.max(1, Math.round(first.durationMs / 1000)),
  };
}

export function mapPlaylistSummaryToProfilePlaylist(
  playlist: PlaylistSummaryDto,
): ProfilePlaylist {
  return {
    id: playlist.id,
    title: playlist.title,
    trackCount: playlist.trackCount,
    coverUrl: playlist.coverUrl ?? playlist.coverFallbackUrls[0] ?? '',
  };
}

export function mapAlbumSummaryToProfileAlbum(
  album: AlbumSummaryDto,
): ProfileAlbum {
  const yearLabel = album.releasedAt
    ? String(new Date(album.releasedAt).getFullYear())
    : 'Draft';

  return {
    id: album.id,
    title: album.title,
    yearLabel,
    trackCount: album.trackCount,
    coverUrl: album.coverUrl ?? album.coverFallbackUrl ?? '',
  };
}
