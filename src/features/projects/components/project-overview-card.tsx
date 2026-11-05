import { View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { ProjectDetail } from '../types';

type ProjectOverviewCardProps = {
  project: ProjectDetail;
};

/** Identity block — title + meta only. */
export function ProjectOverviewCard({ project }: ProjectOverviewCardProps) {
  return (
    <View className="gap-2 rounded-3xl bg-surface-container px-5 py-5">
      <Text variant="headline-md" className="text-on-surface" numberOfLines={2}>
        {project.title}
      </Text>
      <Text variant="body-md" className="text-on-surface-variant">
        {project.audioItemCount} items · Last edited {project.updatedLabel}
      </Text>
    </View>
  );
}
