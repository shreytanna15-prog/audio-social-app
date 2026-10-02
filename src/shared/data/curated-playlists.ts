export type CuratedPlaylist = {
  id: string;
  title: string;
  curator: string;
  trackCount: number;
  coverUrl: string;
};

export const CURATED_PLAYLISTS: CuratedPlaylist[] = [
  {
    id: '1',
    title: 'Late Night Stem Lab',
    curator: 'VibeOGram Editorial',
    trackCount: 42,
    coverUrl:
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=400&fit=crop',
  },
  {
    id: '2',
    title: 'Vocalist: Raw Takes',
    curator: 'Community Curated',
    trackCount: 28,
    coverUrl:
      'https://images.unsplash.com/photo-1598653222100-a723c5f9e0f2?w=400&h=400&fit=crop',
  },
  {
    id: '3',
    title: 'Future Bass Kitchen',
    curator: 'Daily Drops',
    trackCount: 35,
    coverUrl:
      'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=400&fit=crop',
  },
  {
    id: '4',
    title: 'Studio Warmups',
    curator: 'Editorial',
    trackCount: 36,
    coverUrl:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop',
  },
  {
    id: '5',
    title: 'Stem Sampling Pack',
    curator: 'VibeOGram Lab',
    trackCount: 52,
    coverUrl:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
  },
  {
    id: '6',
    title: 'Deep Focus Loops',
    curator: 'Editorial',
    trackCount: 40,
    coverUrl:
      'https://images.unsplash.com/photo-1459749411175-04bf5296774d?w=400&h=400&fit=crop',
  },
];
