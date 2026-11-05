import { describe, expect, it } from 'vitest';

import {
  SEARCH_TABS,
  buildSearchChips,
  isArtistResultsChip,
  isComingSoonChip,
} from './search-tabs';

describe('SEARCH_TABS (unit)', () => {
  it('matches Figma chips: Recent, Results, Artists, Local', () => {
    expect(SEARCH_TABS.map((t) => t.id)).toEqual([
      'recent',
      'results',
      'artists',
      'local',
    ]);
  });

  it('buildSearchChips annotates Results with the active query', () => {
    const chips = buildSearchChips('Midnight');
    expect(chips.find((c) => c.id === 'results')?.label).toBe(
      'Results ("Midnight")',
    );
  });

  it('classifies artist vs coming-soon chips', () => {
    expect(isArtistResultsChip('artists')).toBe(true);
    expect(isArtistResultsChip('results')).toBe(true);
    expect(isComingSoonChip('local')).toBe(true);
    expect(isComingSoonChip('recent')).toBe(false);
  });
});
