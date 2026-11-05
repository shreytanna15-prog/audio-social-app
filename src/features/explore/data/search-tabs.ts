export type SearchChipId = 'recent' | 'results' | 'artists' | 'local';

export type SearchTabId = SearchChipId;

export type SearchTab = {
  id: SearchChipId;
  label: string;
};

/** Figma Search filter strip: Recent | Results | Artists | Local */
export const SEARCH_TABS: SearchTab[] = [
  { id: 'recent', label: 'Recent' },
  { id: 'results', label: 'Results' },
  { id: 'artists', label: 'Artists' },
  { id: 'local', label: 'Local' },
];

export function buildSearchChips(query: string): SearchTab[] {
  const trimmed = query.trim();
  return SEARCH_TABS.map((tab) => {
    if (tab.id === 'results' && trimmed.length > 0) {
      const short =
        trimmed.length > 12 ? `${trimmed.slice(0, 12)}…` : trimmed;
      return { ...tab, label: `Results ("${short}")` };
    }
    return tab;
  });
}

export function isArtistResultsChip(id: SearchChipId): boolean {
  return id === 'results' || id === 'artists';
}

export function isComingSoonChip(id: SearchChipId): boolean {
  return id === 'local';
}
