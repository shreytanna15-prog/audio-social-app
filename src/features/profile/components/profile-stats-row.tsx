import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { Profile } from '../types';

type ProfileStatsRowProps = {
  stats: Profile['stats'];
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
};

function StatCell({
  value,
  label,
  onPress,
}: {
  value: string;
  label: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <Text className="font-sans text-[22px] font-bold leading-7 tracking-tight text-ink">
        {value}
      </Text>
      <Text className="font-sans text-[11px] font-medium uppercase leading-4 tracking-[0.06em] text-slate">
        {label}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${value} ${label}`}
        className="min-w-0 flex-1 items-center gap-1 px-1 active:opacity-80">
        {content}
      </Pressable>
    );
  }

  return (
    <View className="min-w-0 flex-1 items-center gap-1 px-1">{content}</View>
  );
}

export function ProfileStatsRow({
  stats,
  onFollowersPress,
  onFollowingPress,
}: ProfileStatsRowProps) {
  return (
    <View className="mx-4 flex-row items-center rounded-2xl border border-white/5 bg-surface-container py-4">
      <StatCell value={stats.playsLabel} label="Plays" />
      <View className="h-9 w-px bg-white/10" />
      <StatCell
        value={stats.followersLabel}
        label="Followers"
        onPress={onFollowersPress}
      />
      <View className="h-9 w-px bg-white/10" />
      <StatCell
        value={stats.followingLabel}
        label="Following"
        onPress={onFollowingPress}
      />
    </View>
  );
}
