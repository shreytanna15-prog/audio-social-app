export type FeedArtistDto = {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  isFollowing: boolean;
};

export type FeedClipItemDto = {
  id: string;
  trackId: string;
  title: string;
  caption: string | null;
  clipAudioUrl: string;
  mixUrl: string | null;
  coverUrl: string | null;
  durationMs: number;
  trackDurationMs: number;
  startMs: number;
  endMs: number;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  artist: FeedArtistDto;
};

/** @deprecated Use FeedClipItemDto — feed list is clip-based. */
export type FeedItemDto = FeedClipItemDto;

export type FeedPageDto = {
  items: FeedClipItemDto[];
  nextCursor: string | null;
};

export type FeedClipUploadUrlDto = {
  path: string;
  signedUrl: string;
  token?: string;
};

export type CreateFeedClipRequest = {
  trackId: string;
  clipAudioPath: string;
  startMs: number;
  endMs: number;
  durationMs: number;
};

export type FeedClipSummaryDto = {
  id: string;
  trackId: string;
  startMs: number;
  endMs: number;
  durationMs: number;
  likeCount: number;
  clipAudioPath: string;
};

export type FeedClipLikeResultDto = {
  id: string;
  isLiked: boolean;
  likeCount: number;
};
