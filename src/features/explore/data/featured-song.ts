export type FeaturedSong = {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  category: string;
  description: string;
  badgeLabel: string;
};

/** Design reference only — not exported or wired to Explore. */
const _FEATURED_SONG: FeaturedSong = {
  id: 'featured-neo-soul',
  title: 'Neo-Soul & R&B',
  artist: 'Warm Grooves Collective',
  coverUrl:
    'https://images.unsplash.com/photo-1516280440612-4805766bf1d4?w=900&h=560&fit=crop',
  category: 'WARM GROOVES',
  description: 'Rhodes velvet, organic basslines & rich vocal stacks',
  badgeLabel: 'FEATURED • 3.4k Stems',
};
