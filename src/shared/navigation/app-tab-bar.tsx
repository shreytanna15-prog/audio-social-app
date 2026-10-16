import { useState } from 'react';
import { useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { AudioLines, Compass, Home, Plus, User, X } from 'lucide-react-native';
import { type LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MiniPlayer } from '@/features/player';
import { CreateSheet, type CreateActionId } from '@/shared/components/create';
import { Text } from '@/shared/components/ui/text';

const ACTIVE_COLOR = '#D0BCFF';
const INACTIVE_COLOR = '#CBC3D7';
const BAR_BG = '#131319';
const FALLBACK_BAR_HEIGHT = 74;

type TabVisual = {
  routeName: string;
  label: string;
  Icon: typeof Home;
};

const LEFT_TABS: TabVisual[] = [
  { routeName: 'index', label: 'Home', Icon: Home },
  { routeName: 'explore', label: 'Explore', Icon: Compass },
];

const RIGHT_TABS: TabVisual[] = [
  { routeName: 'feed', label: 'Feed', Icon: AudioLines },
  { routeName: 'profile', label: 'Profile', Icon: User },
];

function TabItem({
  label,
  Icon,
  focused,
  onPress,
  onLongPress,
}: {
  label: string;
  Icon: typeof Home;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const color = focused ? ACTIVE_COLOR : INACTIVE_COLOR;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      accessibilityLabel={label}
      className="flex-1 items-center justify-center gap-1 py-1">
      <Icon size={22} color={color} strokeWidth={focused ? 2.2 : 1.8} />
      <Text
        variant="caption"
        style={{ color }}
        className={focused ? 'font-semibold' : 'font-medium'}>
        {label}
      </Text>
    </Pressable>
  );
}

function CreateTabButton({
  open,
  onPress,
}: {
  open: boolean;
  onPress: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={open ? 'Close create menu' : 'Create'}
        className="-mt-5 h-14 w-14 items-center justify-center rounded-full"
        style={styles.plusOuter}>
        <View className="h-11 w-11 items-center justify-center rounded-full bg-[#1B1B21]">
          {open ? (
            <X size={24} color="#FFFFFF" strokeWidth={2.4} />
          ) : (
            <Plus size={26} color="#FFFFFF" strokeWidth={2.4} />
          )}
        </View>
      </Pressable>
    </View>
  );
}

export function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { push } = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [barHeight, setBarHeight] = useState(FALLBACK_BAR_HEIGHT + Math.max(insets.bottom, 10));
  const bottomPad = Math.max(insets.bottom, 10);

  const onBarLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height;
    setBarHeight((prev) => (prev === next ? prev : next));
  };

  const onCreateSelect = (action: CreateActionId) => {
    const route =
      action === 'quick-record'
        ? '/studio/quick-record'
        : action === 'multitrack-studio'
          ? '/studio/multitrack'
          : null;

    if (!route) {
      return;
    }

    // Let the sheet start dismissing, then push onto the root stack.
    setCreateOpen(false);
    requestAnimationFrame(() => {
      push(route);
    });
  };

  const renderTab = (tab: TabVisual) => {
    const routeIndex = state.routes.findIndex((route) => route.name === tab.routeName);
    if (routeIndex < 0) return null;

    const route = state.routes[routeIndex];
    const focused = state.index === routeIndex;
    const { options } = descriptors[route.key];

    const onPress = () => {
      if (createOpen) {
        setCreateOpen(false);
      }

      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    const onLongPress = () => {
      navigation.emit({
        type: 'tabLongPress',
        target: route.key,
      });
    };

    return (
      <TabItem
        key={route.key}
        label={options.title ?? tab.label}
        Icon={tab.Icon}
        focused={focused}
        onPress={onPress}
        onLongPress={onLongPress}
      />
    );
  };

  return (
    <>
      <CreateSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        bottomOffset={barHeight}
        onSelect={onCreateSelect}
      />

      <View
        className="border-t border-white/5"
        onLayout={onBarLayout}
        style={[styles.bar, { paddingBottom: bottomPad }]}>
        <MiniPlayer />
        <View className="h-16 flex-row items-end px-1">
          {LEFT_TABS.map(renderTab)}
          <CreateTabButton
            open={createOpen}
            onPress={() => setCreateOpen((prev) => !prev)}
          />
          {RIGHT_TABS.map(renderTab)}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: BAR_BG,
  },
  plusOuter: {
    experimental_backgroundImage:
      'linear-gradient(135deg, #FF2BB5 0%, #A078FF 45%, #D0BCFF 100%)',
    boxShadow: '0 6px 16px rgba(160, 120, 255, 0.35)',
  },
});
