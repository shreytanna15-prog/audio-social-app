import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { LibraryTab } from '../types';

const TABS: { id: LibraryTab; label: string }[] = [
  { id: 'audio', label: 'Audio' },
  { id: 'projects', label: 'Projects' },
  { id: 'albums', label: 'Albums' },
  { id: 'playlists', label: 'Playlists' },
  { id: 'saved', label: 'Saved' },
];

const ACTIVE_BG = '#A078FF';
const ACTIVE_TEXT = '#FFFFFF';
const INACTIVE_TEXT = '#958EA0';

type LibrarySegmentTabsProps = {
  activeTab: LibraryTab;
  onChange: (tab: LibraryTab) => void;
};

export function LibrarySegmentTabs({ activeTab, onChange }: LibrarySegmentTabsProps) {
  return (
    <View className="px-4 py-3">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="grow-0"
        contentContainerStyle={{ alignItems: 'center', gap: 10 }}>
        {TABS.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onChange(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={tab.label}
              className="h-9 min-w-9 items-center justify-center rounded-full px-3.5"
              style={{
                backgroundColor: active ? ACTIVE_BG : 'rgba(255,255,255,0.04)',
                borderCurve: 'continuous',
              }}>
              <Text
                variant="label-md"
                numberOfLines={1}
                style={{
                  color: active ? ACTIVE_TEXT : INACTIVE_TEXT,
                  fontWeight: active ? '600' : '500',
                }}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
