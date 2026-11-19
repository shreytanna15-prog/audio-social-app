export type TrendingTrack = {
  id: string;
  rank: number;
  title: string;
  artist: string;
  coverUrl: string;
  playsLabel: string;
  remixesLabel: string;
  likeCount: number;
  isLiked: boolean;
  verified?: boolean;
  /** Present when mapped from discover APIs; fixtures omit it. */
  mixUrl?: string | null;
};

export const TRENDING_TRACKS: TrendingTrack[] = [
  {
    id: '1',
    rank: 1,
    title: 'Neon Horizons',
    artist: 'Aura Mist',
    coverUrl:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop',
    playsLabel: '48.2k plays',
    remixesLabel: '1.4k remixes',
    likeCount: 4820,
    isLiked: false,
    verified: true,
  },
  {
    id: '2',
    rank: 2,
    title: 'After Hours Vibe',
    artist: 'Julian K.',
    coverUrl:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop',
    playsLabel: '34.9k plays',
    remixesLabel: '890 remixes',
    likeCount: 3490,
    isLiked: true,
    verified: true,
  },
  {
    id: '3',
    rank: 3,
    title: 'Echoes in the Rain',
    artist: 'Celine & The North',
    coverUrl:
      'https://images.unsplash.com/photo-1516280440612-4805766bf1d4?w=200&h=200&fit=crop',
    playsLabel: '29.1k plays',
    remixesLabel: '612 remixes',
    likeCount: 2910,
    isLiked: false,
    verified: false,
  },
  {
    id: '4',
    rank: 4,
    title: 'Velvet Frequency',
    artist: 'Subterranean',
    coverUrl:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop',
    playsLabel: '22.7k plays',
    remixesLabel: '415 remixes',
    likeCount: 2270,
    isLiked: false,
    verified: true,
  },
];
