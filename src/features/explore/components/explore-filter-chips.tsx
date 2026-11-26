import { Pressable, ScrollView } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { ExploreFilter } from '../data/explore-filters';

type ChipOption = Pick<ExploreFilter, 'id' | 'label'>;

type ExploreFilterChipsProps = {
  filters: ChipOption[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function ExploreFilterChips({
  filters,
  selectedId,
  onSelect,
}: ExploreFilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
      {filters.map((filter) => {
        const selected = filter.id === selectedId;

        return (
          <Pressable
            key={filter.id}
            onPress={() => onSelect(filter.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={filter.label}
            className={
              selected
                ? 'rounded-full bg-primary-tonal px-4 py-2.5'
                : 'rounded-full border border-white/10 bg-surface-container-high px-4 py-2.5'
            }>
            <Text
              variant="label-md"
              className={
                selected
                  ? 'font-semibold text-on-primary'
                  : 'font-medium text-on-surface-variant'
              }>
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
