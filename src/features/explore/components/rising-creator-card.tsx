import { Image } from 'expo-image';
import { Check, Play, TrendingUp, UserPlus } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { RisingCreator } from '../data/rising-creator';

type RisingCreatorCardProps = {
  creator: RisingCreator;
  onPress?: () => void;
  onSamplePress?: () => void;
  onFollowPress?: () => void;
};

export function RisingCreatorCard({
  creator,
  onPress,
  onSamplePress,
  onFollowPress,
}: RisingCreatorCardProps) {
  return (
    <View className="mx-4 gap-4 rounded-2xl border border-white/5 bg-surface-container p-4">
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-row items-center gap-1.5 rounded-full bg-surface-container-high px-2.5 py-1.5">
          <TrendingUp size={12} color="#D0BCFF" strokeWidth={2.4} />
          <Text variant="caption" className="font-semibold uppercase text-on-surface-variant">
            {creator.badgeLabel ?? 'Rising Creator of the Week'}
          </Text>
        </View>

        {creator.spikeLabel ? (
          <Text variant="caption" className="font-bold text-[#FFB0CD]">
            {creator.spikeLabel}
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={onPress ? `Open ${creator.name} profile` : undefined}
        className="flex-row items-center gap-3.5">
        <View className="relative">
          <View className="h-20 w-20 overflow-hidden rounded-2xl bg-surface-container-high">
            <Image
              source={{ uri: creator.avatarUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              recyclingKey={creator.id}
            />
          </View>
          {creator.verified ? (
            <View className="absolute -bottom-1 -right-1 h-5 w-5 items-center justify-center rounded-full border-2 border-surface-container bg-primary-container">
              <Check size={10} color="#FFFFFF" strokeWidth={3} />
            </View>
          ) : null}
        </View>

        <View className="min-w-0 flex-1 gap-1">
          <Text variant="headline-md" className="text-on-surface" numberOfLines={1}>
            {creator.name}
          </Text>
          <Text variant="body-md" className="text-on-surface-variant" numberOfLines={1}>
            {creator.role}
          </Text>
          <Text variant="caption" className="text-on-surface-variant" numberOfLines={1}>
            {creator.meta}
          </Text>
        </View>
      </Pressable>

      <View className="flex-row gap-2.5">
        {onSamplePress ? (
          <Pressable
            onPress={onSamplePress}
            accessibilityRole="button"
            accessibilityLabel={`Play latest by ${creator.name}`}
            className="h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-full border border-white/10 bg-surface-container-high px-3">
            <Play size={15} color="#E4E1EA" strokeWidth={2.2} fill="#E4E1EA" />
            <Text variant="label-md" className="font-semibold text-on-surface">
              Play latest
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={onFollowPress}
          accessibilityRole="button"
          accessibilityLabel={`Follow ${creator.name}`}
          className="h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-full bg-primary-tonal px-3">
          <UserPlus size={15} color="#3C0091" strokeWidth={2.2} />
          <Text variant="label-md" className="font-semibold text-on-primary">
            Follow
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
