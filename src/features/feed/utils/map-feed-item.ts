import type { FeedClipItemDto } from '../api/types';
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

export function mapFeedItemToVibe(dto: FeedClipItemDto): FeedVibe {
  const clipDurationSec = Math.max(1, Math.round(dto.durationMs / 1000));
  const trackDurationSec = Math.max(
    clipDurationSec,
    Math.round(dto.trackDurationMs / 1000),
  );
  const clipUrl = dto.clipAudioUrl?.trim() || null;
  const mixUrl = dto.mixUrl?.trim() || null;

  return {
    id: dto.id,
    trackId: dto.trackId,
    title: dto.title,
    subtitle: dto.caption?.trim() || undefined,
    artist: artistDisplayName(dto.artist),
    artistId: dto.artist.id,
    artistAvatarUrl: dto.artist.avatarUrl ?? '',
    coverUrl: dto.coverUrl ?? '',
    genresLabel: 'Clip',
    verified: false,
    likesLabel: formatCount(dto.likeCount),
    commentsLabel: formatCount(dto.commentCount),
    sharesLabel: 'Share',
    durationSec: trackDurationSec,
    previewDurationSec: clipDurationSec,
    previewAudio: clipUrl ? { uri: clipUrl } : undefined,
    waveformPeaks: buildPeaksForSeed(dto.id),
    mixUrl,
    isLiked: dto.isLiked,
    isFollowing: dto.artist.isFollowing,
    likeCount: dto.likeCount,
    commentCount: dto.commentCount,
  };
}
