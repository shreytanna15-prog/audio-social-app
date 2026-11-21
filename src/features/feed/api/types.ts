export type FeedArtistDto = {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  isFollowing: boolean;
};

export type FeedItemDto = {
  id: string;
  title: string;
  caption: string | null;
  durationMs: number;
  coverUrl: string | null;
  mixUrl: string | null;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  publishedAt: string | null;
  genres: string[];
  artist: FeedArtistDto;
};

export type FeedPageDto = {
  items: FeedItemDto[];
  nextCursor: string | null;
};
