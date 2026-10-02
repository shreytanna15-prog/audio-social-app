export type ExploreFilter = {
  id: string;
  label: string;
};

export const EXPLORE_FILTERS: ExploreFilter[] = [
  { id: 'all', label: 'All' },
  { id: 'trending-stems', label: 'Trending Stems' },
  { id: 'vocalists', label: 'Vocalists' },
  { id: 'producers', label: 'Producers' },
  { id: 'playlists', label: 'Playlists' },
  { id: 'live-takes', label: 'Live Takes' },
  { id: 'collabs', label: 'Collabs' },
];
