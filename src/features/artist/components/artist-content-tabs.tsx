import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { ArtistContentTab } from '../types';

const TABS: { id: ArtistContentTab; label: string }[] = [
  { id: 'songs', label: 'Songs' },
  { id: 'albums', label: 'Albums' },
  { id: 'playlists', label: 'Playlists' },
];

/** Figma selected tab SVG: 99.33×38 · #1F1F25 · #D0BCFF label · 32×2 underline */
const ACTIVE = '#D0BCFF';
const INACTIVE = '#C4B8CE';
const CHIP_BG = '#1F1F25';

type ArtistContentTabsProps = {
  activeTab: ArtistContentTab;
  onChange: (tab: ArtistContentTab) => void;
};

export function ArtistContentTabs({ activeTab, onChange }: ArtistContentTabsProps) {
  return (
    <View className="mx-4 flex-row items-center justify-between">
      {TABS.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
            className="relative h-[38px] min-w-[99px] items-center justify-center rounded-lg px-5"
            style={
              active
                ? {
                    backgroundColor: CHIP_BG,
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  }
                : undefined
            }>
            <Text
              className="font-sans text-[17px] leading-[22px] tracking-tight"
              style={{
                color: active ? ACTIVE : INACTIVE,
                fontWeight: active ? '600' : '500',
              }}>
              {tab.label}
            </Text>
            {active ? (
              <View
                className="absolute bottom-[3px] h-[2px] w-8 rounded-full"
                style={{ backgroundColor: ACTIVE }}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
