import { ScrollView, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

export type HomeSkeletonVariant =
  | 'project'
  | 'artists'
  | 'vibe'
  | 'trending'
  | 'playlists'
  | 'recently';

type HomeSectionSkeletonProps = {
  variant: HomeSkeletonVariant;
  title?: string;
};

function Bone({ className, style }: { className?: string; style?: object }) {
  return (
    <View
      className={`rounded-xl bg-surface-container-high ${className ?? ''}`}
      style={style}
    />
  );
}

function SectionHeader({ title }: { title?: string }) {
  if (!title) {
    return null;
  }

  return (
    <View className="px-4">
      <Text variant="title-lg" className="text-on-surface">
        {title}
      </Text>
    </View>
  );
}

export function HomeSectionSkeleton({
  variant,
  title,
}: HomeSectionSkeletonProps) {
  if (variant === 'project') {
    return (
      <View className="mx-4 gap-3 rounded-2xl border border-white/5 bg-surface-container p-4">
        <View className="flex-row items-start gap-3">
          <Bone className="h-12 w-12" />
          <View className="min-w-0 flex-1 gap-2">
            <Bone className="h-4 w-40" />
            <Bone className="h-3 w-28" />
            <Bone className="h-3 w-32" />
          </View>
        </View>
        <Bone className="h-10 w-full rounded-full" />
      </View>
    );
  }

  if (variant === 'artists') {
    return (
      <View className="gap-4">
        <SectionHeader title={title ?? 'Featured Artists'} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}>
          {Array.from({ length: 5 }).map((_, index) => (
            <View key={`artist-skel-${index}`} className="w-22 items-center gap-2">
              <Bone className="h-18 w-18 rounded-full" />
              <Bone className="h-3 w-16" />
              <Bone className="h-4 w-14 rounded-full" />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (variant === 'vibe') {
    return (
      <View className="gap-4">
        <SectionHeader title={title ?? 'Made for your vibe'} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}>
          {Array.from({ length: 2 }).map((_, index) => (
            <View
              key={`vibe-skel-${index}`}
              className="overflow-hidden rounded-2xl border border-white/5 bg-surface-container"
              style={{ width: 268 }}>
              <Bone className="rounded-none" style={{ width: 268, height: 268 }} />
              <View className="gap-2 p-3">
                <Bone className="h-4 w-40" />
                <Bone className="h-3 w-28" />
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (variant === 'trending') {
    return (
      <View className="gap-4 px-4">
        <SectionHeader title={title ?? 'Trending'} />
        <View className="gap-2.5">
          {Array.from({ length: 4 }).map((_, index) => (
            <View
              key={`trend-skel-${index}`}
              className="flex-row items-center gap-3 rounded-2xl border border-white/5 bg-surface-container p-2.5">
              <Bone className="h-4 w-5" />
              <Bone className="h-12 w-12" />
              <View className="min-w-0 flex-1 gap-2">
                <Bone className="h-4 w-40" />
                <Bone className="h-3 w-28" />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (variant === 'playlists') {
    return (
      <View className="gap-4">
        <SectionHeader title={title ?? 'Your playlists'} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}>
          {Array.from({ length: 3 }).map((_, index) => (
            <View key={`playlist-skel-${index}`} className="w-36 gap-2">
              <Bone className="h-36 w-36" />
              <Bone className="h-4 w-28" />
              <Bone className="h-3 w-20" />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="gap-4 px-4">
      <SectionHeader title={title ?? 'Recently played'} />
      <View className="gap-2.5">
        {Array.from({ length: 2 }).map((_, row) => (
          <View key={`recent-skel-row-${row}`} className="flex-row gap-2.5">
            {Array.from({ length: 2 }).map((__, col) => (
              <View
                key={`recent-skel-${row}-${col}`}
                className="min-w-0 flex-1 flex-row items-center gap-2.5 rounded-2xl border border-white/5 bg-surface-container p-2">
                <Bone className="h-12 w-12" />
                <View className="min-w-0 flex-1 gap-2">
                  <Bone className="h-4 w-24" />
                  <Bone className="h-3 w-16" />
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}
