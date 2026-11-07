import { Image } from 'expo-image';
import { Music2 } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

type CollectionOverviewCardProps = {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  meta: string;
  badges?: string[];
  action?: ReactNode;
};

export function CollectionOverviewCard({
  id,
  title,
  description,
  coverUrl,
  meta,
  badges = [],
  action,
}: CollectionOverviewCardProps) {
  return (
    <View className="gap-4 rounded-3xl bg-surface-container px-5 py-5">
      <View className="flex-row gap-4">
        <View
          className="h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-surface-container-highest"
          style={{ borderCurve: 'continuous' }}>
          {coverUrl ? (
            <Image
              source={{ uri: coverUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              recyclingKey={id}
              transition={160}
            />
          ) : (
            <Music2 size={32} color="#958EA0" strokeWidth={1.8} />
          )}
        </View>

        <View className="min-w-0 flex-1 justify-center gap-1.5">
          <Text
            variant="headline-md"
            className="text-on-surface"
            numberOfLines={2}>
            {title}
          </Text>
          <Text variant="body-md" className="text-on-surface-variant">
            {meta}
          </Text>
          {badges.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {badges.map((badge) => (
                <View
                  key={badge}
                  className="rounded-full bg-surface-container-highest px-2.5 py-1">
                  <Text variant="caption" className="text-on-surface-variant">
                    {badge}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      {description ? (
        <Text
          variant="body-md"
          className="text-on-surface-variant"
          numberOfLines={4}>
          {description}
        </Text>
      ) : null}

      {action}
    </View>
  );
}
