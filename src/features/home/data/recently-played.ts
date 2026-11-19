export type RecentlyPlayedTrack = {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  likeCount: number;
  isLiked: boolean;
  mixUrl?: string | null;
};

/** Design/demo fixtures — Home screen renders API data; keep these in repo. */
export const RECENTLY_PLAYED: RecentlyPlayedTrack[] = [
  {
    id: '1',
    title: 'Lucid Frequency',
    artist: 'Nova Drift',
    coverUrl:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop',
    likeCount: 420,
    isLiked: false,
  },
  {
    id: '2',
    title: 'Prism Wave (Live)',
    artist: 'SOMA Waves',
    coverUrl:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop',
    likeCount: 890,
    isLiked: true,
  },
  {
    id: '3',
    title: 'Golden Hour Dust',
    artist: 'Céline',
    coverUrl:
      'https://images.unsplash.com/photo-1516280440612-4805766bf1d4?w=200&h=200&fit=crop',
    likeCount: 310,
    isLiked: false,
  },
  {
    id: '4',
    title: 'Midnight Drift',
    artist: 'Maya (You)',
    coverUrl:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop',
    likeCount: 150,
    isLiked: false,
  },
];
