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

export type RisingArtistSampleTrackDto = {
  id: string;
  title: string;
  coverUrl: string | null;
  mixUrl: string | null;
};

export type RisingArtistDto = FeaturedArtistDto & {
  sampleTrack: RisingArtistSampleTrackDto | null;
};

export type DiscoverPlaylistDto = {
  id: string;
  title: string;
  coverUrl: string | null;
  coverFallbackUrls: string[];
  trackCount: number;
  saveCount: number;
  owner: {
    id: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  };
};

export type MadeForYouTrackDto = DiscoverTrackDto & {
  reason: 'taste' | 'fresh';
};

export type TrendingWindow = '30d' | 'all';
