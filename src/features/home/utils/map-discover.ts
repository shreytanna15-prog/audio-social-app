import type {
  DiscoverTrackDto,
  FeaturedArtistDto,
  MadeForYouTrackDto,
} from '@/features/discover';
import {
  TRACK_GENRE_LABELS,
  type TrackGenreId,
} from '@/features/tracks/constants/track-genres';
import type { CuratedPlaylist } from '@/shared/data/curated-playlists';
import type { FeaturedArtist } from '@/shared/data/featured-artists';
import type { TrendingTrack } from '@/shared/data/trending-tracks';

import type { HomePlaylistDto, RecentlyPlayedDto } from '../api/types';
import type { RecentlyPlayedTrack } from '../data/recently-played';
import type { VibeTrack } from '../components/made-for-your-vibe-section';

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

function genreLabel(id: string | undefined): string {
  if (!id) return 'Artist';
  return TRACK_GENRE_LABELS[id as TrackGenreId] ?? id;
}

function artistDisplayName(artist: {
  name: string | null;
  username: string;
}): string {
  return artist.name?.trim() || artist.username;
}

export function mapFeaturedArtist(dto: FeaturedArtistDto): FeaturedArtist {
  return {
    id: dto.id,
    name: artistDisplayName(dto),
    genre:
      dto.followerCount > 0
        ? `${formatCount(dto.followerCount)} followers`
        : 'New artist',
    avatarUrl: dto.avatarUrl ?? '',
    verified: false,
  };
}

export function mapTrendingTrack(
  dto: DiscoverTrackDto,
  rank: number,
): TrendingTrack {
  return {
    id: dto.id,
    rank,
    title: dto.title,
    artist: artistDisplayName(dto.artist),
    coverUrl: dto.coverUrl ?? '',
    playsLabel: `${formatCount(dto.playCount)} plays`,
    remixesLabel: genreLabel(dto.genres[0]),
    likeCount: dto.likeCount,
    isLiked: false,
    verified: false,
    mixUrl: dto.mixUrl,
  };
}

export function mapMadeForYouTrack(dto: MadeForYouTrackDto): VibeTrack {
  const primary = dto.genres[0];
  const secondary = dto.genres[1];
  return {
    id: dto.id,
    title: dto.title,
    artist: artistDisplayName(dto.artist),
    coverUrl: dto.coverUrl ?? '',
    likeCount: dto.likeCount,
    isLiked: false,
    primaryTag: genreLabel(primary),
    secondaryTag: secondary ? genreLabel(secondary) : undefined,
    primaryTagTone: dto.reason === 'fresh' ? 'pink' : 'purple',
    mixUrl: dto.mixUrl,
  };
}

export function mapHomePlaylist(dto: HomePlaylistDto): CuratedPlaylist {
  const curator =
    dto.source === 'owned'
      ? 'Your playlist'
      : dto.owner?.name?.trim() ||
        dto.owner?.username ||
        'Saved playlist';

  return {
    id: dto.id,
    title: dto.title,
    curator,
    trackCount: dto.trackCount,
    coverUrl: dto.coverUrl ?? dto.coverFallbackUrls[0] ?? '',
  };
}

export function mapRecentlyPlayedTrack(
  dto: RecentlyPlayedDto,
): RecentlyPlayedTrack {
  return {
    id: dto.id,
    title: dto.title,
    artist: artistDisplayName(dto.artist),
    coverUrl: dto.coverUrl ?? '',
    likeCount: dto.likeCount,
    isLiked: false,
    mixUrl: dto.mixUrl,
  };
}

export function formatRelativeUpdatedAt(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
