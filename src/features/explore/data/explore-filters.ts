export type ExploreFilter = {
  id: string;
  label: string;
};

/** Design reference only — not exported or wired to Explore. */
const _EXPLORE_FILTERS: ExploreFilter[] = [
  { id: 'all', label: 'All' },
  { id: 'trending-stems', label: 'Trending Stems' },
  { id: 'vocalists', label: 'Vocalists' },
  { id: 'producers', label: 'Producers' },
  { id: 'playlists', label: 'Playlists' },
  { id: 'live-takes', label: 'Live Takes' },
  { id: 'collabs', label: 'Collabs' },
];
