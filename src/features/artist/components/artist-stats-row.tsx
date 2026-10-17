import { View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { ArtistProfile } from '../types';

type ArtistStatsRowProps = {
  stats: ArtistProfile['stats'];
};

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <View className="min-w-0 flex-1 items-center gap-1 px-1">
      <Text className="font-sans text-[22px] font-bold leading-7 tracking-tight text-ink">
        {value}
      </Text>
      <Text className="font-sans text-[11px] font-medium uppercase leading-4 tracking-[0.06em] text-slate">
        {label}
      </Text>
    </View>
  );
}

export function ArtistStatsRow({ stats }: ArtistStatsRowProps) {
  return (
    <View className="mx-4 flex-row items-center rounded-2xl border border-white/5 bg-surface-container py-4">
      <StatCell value={stats.playsLabel} label="Plays" />
      <View className="h-9 w-px bg-white/10" />
      <StatCell value={stats.followersLabel} label="Followers" />
      <View className="h-9 w-px bg-white/10" />
      <StatCell value={stats.likesLabel} label="Likes" />
    </View>
  );
}
