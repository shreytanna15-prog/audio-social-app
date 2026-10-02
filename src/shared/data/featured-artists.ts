export type FeaturedArtist = {
  id: string;
  name: string;
  genre: string;
  avatarUrl: string;
  verified?: boolean;
};

export const FEATURED_ARTISTS: FeaturedArtist[] = [
  {
    id: '1',
    name: 'Kaelen Voss',
    genre: 'Neo-Soul',
    avatarUrl:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop&crop=faces',
    verified: true,
  },
  {
    id: '2',
    name: 'SOMA Waves',
    genre: 'Synthwave',
    avatarUrl:
      'https://images.unsplash.com/photo-1516280440612-4805766bf1d4?w=200&h=200&fit=crop&crop=faces',
    verified: true,
  },
  {
    id: '3',
    name: 'Luna Reed',
    genre: 'Alt-R&B',
    avatarUrl:
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&h=200&fit=crop&crop=faces',
    verified: true,
  },
  {
    id: '4',
    name: 'Jax Orion',
    genre: 'Hip-Hop',
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
    verified: true,
  },
  {
    id: '5',
    name: 'Nova Blake',
    genre: 'Indie Pop',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994d69daeb?w=200&h=200&fit=crop&crop=faces',
    verified: true,
  },
  {
    id: '6',
    name: 'Echo Park',
    genre: 'Electronic',
    avatarUrl:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=faces',
    verified: true,
  },
];
