import { View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { ProjectDetail } from '../types';

type ProjectOverviewCardProps = {
  project: ProjectDetail;
};

/** Identity block — title + meta only. */
export function ProjectOverviewCard({ project }: ProjectOverviewCardProps) {
  const itemLabel = project.trackCount === 1 ? 'item' : 'items';

  return (
    <View className="gap-2 rounded-3xl bg-surface-container px-5 py-5">
      <Text variant="headline-md" className="text-on-surface" numberOfLines={2}>
        {project.title}
      </Text>
      {project.description ? (
        <Text variant="body-md" className="text-on-surface-variant" numberOfLines={3}>
          {project.description}
        </Text>
      ) : null}
      <Text variant="body-md" className="text-on-surface-variant">
        {project.trackCount} {itemLabel} · Last edited {project.updatedLabel}
      </Text>
    </View>
  );
}
