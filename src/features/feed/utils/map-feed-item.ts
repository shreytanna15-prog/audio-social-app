import {
  TRACK_GENRE_LABELS,
  type TrackGenreId,
} from '@/features/tracks/constants/track-genres';

import type { FeedItemDto } from '../api/types';
import { buildPeaksForSeed } from '../data/feed-preview-audio';
import type { FeedVibe } from '../types';

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

function artistDisplayName(artist: {
  name: string | null;
  username: string;
}): string {
  return artist.name?.trim() || artist.username;
}

function genresLabel(genres: string[]): string {
  if (genres.length === 0) return 'Track';
  return genres
    .map((id) => TRACK_GENRE_LABELS[id as TrackGenreId] ?? id)
    .join(' / ');
}

export function mapFeedItemToVibe(dto: FeedItemDto): FeedVibe {
  const durationSec = Math.max(0, Math.round(dto.durationMs / 1000));
  const mixUrl = dto.mixUrl?.trim() || null;

  return {
    id: dto.id,
    title: dto.title,
    subtitle: dto.caption?.trim() || undefined,
    artist: artistDisplayName(dto.artist),
    artistId: dto.artist.id,
    artistAvatarUrl: dto.artist.avatarUrl ?? '',
    coverUrl: dto.coverUrl ?? '',
    genresLabel: genresLabel(dto.genres),
    verified: false,
    likesLabel: formatCount(dto.likeCount),
    commentsLabel: formatCount(dto.commentCount),
    sharesLabel: 'Share',
    durationSec,
    previewDurationSec: durationSec,
    previewAudio: mixUrl ? { uri: mixUrl } : undefined,
    waveformPeaks: buildPeaksForSeed(dto.id),
    mixUrl,
    isLiked: dto.isLiked,
    isFollowing: dto.artist.isFollowing,
    likeCount: dto.likeCount,
    commentCount: dto.commentCount,
  };
}
