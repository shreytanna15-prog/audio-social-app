export type SearchChipId = 'music' | 'artists';
export type SearchTabId = SearchChipId;
export type SearchTab = { id: SearchChipId; label: string };

export const SEARCH_TABS: SearchTab[] = [
  { id: 'music', label: 'Music' },
  { id: 'artists', label: 'Artists' },
];

export function buildSearchChips(query: string): SearchTab[] {
  return query.trim() ? SEARCH_TABS : [];
}
