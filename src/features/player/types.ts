export type RepeatMode = 'off' | 'all' | 'one';

export type PlayerTrack = {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  /** Published mix stream URL; missing → show track UI but no audio. */
  mixUrl?: string | null;
  artistId?: string;
  artistAvatarUrl?: string;
  playsLabel?: string;
  likeCountLabel?: string;
  /** Server like count when known (preferred over fixture label). */
  likeCount?: number;
  playCount?: number;
  /** Server liked state on cold open; falls back to likes cache. */
  isLiked?: boolean;
  commentCount?: number;
  durationSec?: number;
  verified?: boolean;
  isFollowingArtist?: boolean;
};

export type PlayTrackOptions = {
  /** Ordered context (playlist/album/liked list). Defaults to `[track]`. */
  queue?: PlayerTrack[];
};

export function trackHasMixUrl(track: PlayerTrack | null | undefined): boolean {
  return Boolean(track?.mixUrl?.trim());
}
