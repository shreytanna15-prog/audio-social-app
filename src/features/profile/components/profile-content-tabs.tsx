import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { ProfileContentTab } from '../types';

const TABS: { id: ProfileContentTab; label: string }[] = [
  { id: 'songs', label: 'Songs' },
  { id: 'albums', label: 'Albums' },
  { id: 'playlists', label: 'Playlists' },
];

const ACTIVE = '#D0BCFF';
const INACTIVE = '#C4B8CE';
const CHIP_BG = '#1F1F25';

type ProfileContentTabsProps = {
  activeTab: ProfileContentTab;
  onChange: (tab: ProfileContentTab) => void;
};

export function ProfileContentTabs({ activeTab, onChange }: ProfileContentTabsProps) {
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
            className="relative h-9.5 min-w-24.75 items-center justify-center rounded-lg px-5"
            style={
              active
                ? {
                    backgroundColor: CHIP_BG,
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  }
                : undefined
            }>
            <Text
              className="font-sans text-[17px] leading-5.5 tracking-tight"
              style={{
                color: active ? ACTIVE : INACTIVE,
                fontWeight: active ? '600' : '500',
              }}>
              {tab.label}
            </Text>
            {active ? (
              <View
                className="absolute bottom-0.75 h-0.5 w-8 rounded-full"
                style={{ backgroundColor: ACTIVE }}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
