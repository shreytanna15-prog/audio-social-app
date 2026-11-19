export type DiscoverTrackArtist = {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
};

export type DiscoverTrackDto = {
  id: string;
  title: string;
  coverUrl: string | null;
  mixUrl: string | null;
  playCount: number;
  likeCount: number;
  publishedAt: string | null;
  genres: string[];
  artist: DiscoverTrackArtist;
};

export type FeaturedArtistDto = {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  followerCount: number;
  latestPublishedAt: string | null;
};

export type MadeForYouTrackDto = DiscoverTrackDto & {
  reason: 'taste' | 'fresh';
};
