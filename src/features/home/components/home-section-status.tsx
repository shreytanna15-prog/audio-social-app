import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import {
  HomeSectionSkeleton,
  type HomeSkeletonVariant,
} from './home-section-skeleton';

type HomeSectionStatusProps = {
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  errorLabel?: string;
  skeleton?: HomeSkeletonVariant;
  skeletonTitle?: string;
};

export function HomeSectionStatus({
  isLoading = false,
  isError = false,
  onRetry,
  errorLabel = 'Couldn’t load this section.',
  skeleton,
  skeletonTitle,
}: HomeSectionStatusProps) {
  if (isLoading) {
    if (skeleton) {
      return (
        <HomeSectionSkeleton variant={skeleton} title={skeletonTitle} />
      );
    }
    return (
      <View className="gap-2 px-4 py-6">
        <View className="h-4 w-1/2 rounded-xl bg-surface-container-high" />
        <View className="h-24 w-full rounded-2xl bg-surface-container-high" />
      </View>
    );
  }

  if (!isError) {
    return null;
  }

  return (
    <View className="gap-2 px-4 py-4">
      <Text variant="body-md" className="text-center text-on-surface-variant">
        {errorLabel}
      </Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry"
          hitSlop={8}
          className="items-center self-center rounded-full bg-surface-container-high px-4 py-2">
          <Text variant="label-md" className="font-semibold text-primary-tonal">
            Retry
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
