import type {
  DiscoverPlaylistDto,
  DiscoverTrackDto,
  FeaturedArtistDto,
  RisingArtistDto,
} from '@/features/discover';
import {
  TRACK_GENRE_LABELS,
  type TrackGenreId,
} from '@/features/tracks/constants/track-genres';
import type { CuratedPlaylist } from '@/shared/data/curated-playlists';
import type { FeaturedArtist } from '@/shared/data/featured-artists';
import type { TrendingTrack } from '@/shared/data/trending-tracks';

import type { FeaturedSong } from '../data/featured-song';
import type { RisingCreator } from '../data/rising-creator';

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

export function mapHeroSong(dto: DiscoverTrackDto, rank: number): FeaturedSong {
  return {
    id: dto.id,
    title: dto.title,
    artist: artistDisplayName(dto.artist),
    coverUrl: dto.coverUrl ?? '',
    category: genreLabel(dto.genres[0]).toUpperCase(),
    description: `${artistDisplayName(dto.artist)} · ${formatCount(dto.playCount)} plays`,
    badgeLabel: `#${rank} All time`,
  };
}

export function mapTopSong(
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

export function mapRisingCreator(dto: RisingArtistDto): RisingCreator {
  const name = artistDisplayName(dto);
  const followers =
    dto.followerCount > 0
      ? `${formatCount(dto.followerCount)} followers`
      : 'New artist';
  const sample = dto.sampleTrack?.title;

  return {
    id: dto.id,
    name,
    role: sample ? `Latest: ${sample}` : 'Recently published',
    meta: followers,
    avatarUrl: dto.avatarUrl ?? dto.sampleTrack?.coverUrl ?? '',
    badgeLabel: 'Rising Creator',
    sampleTitle: sample,
    verified: false,
  };
}

export function mapDiscoverPlaylist(dto: DiscoverPlaylistDto): CuratedPlaylist {
  return {
    id: dto.id,
    title: dto.title,
    curator: artistDisplayName(dto.owner),
    trackCount: dto.trackCount,
    coverUrl: dto.coverUrl ?? dto.coverFallbackUrls[0] ?? '',
  };
}
