export type LatestProjectDto = {
  id: string;
  title: string;
  description: string | null;
  trackCount: number;
  updatedAt: string;
  createdAt: string;
};

export type HomePlaylistDto = {
  id: string;
  title: string;
  coverUrl: string | null;
  coverFallbackUrls: string[];
  trackCount: number;
  source: 'owned' | 'saved';
  owner?: {
    id: string;
    username: string;
    name: string | null;
  };
};

export type RecentlyPlayedDto = {
  id: string;
  title: string;
  coverUrl: string | null;
  mixUrl: string | null;
  playCount: number;
  likeCount: number;
  publishedAt: string | null;
  genres: string[];
  artist: {
    id: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  };
  playedAt: string;
};
