import { FlatList, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { ProjectSummary } from '../types';
import { ProjectListRow } from './project-list-row';

type RecentProjectsListProps = {
  projects: ProjectSummary[];
  onProjectPress: (project: ProjectSummary) => void;
  /** Extra bottom padding for safe area / tab bar. */
  contentBottomInset?: number;
};

/**
 * Create (+) → Recent projects list shell.
 * Uses the shared {@link ProjectListRow}; Library has its own full-list panel.
 */
export function RecentProjectsList({
  projects,
  onProjectPress,
  contentBottomInset = 24,
}: RecentProjectsListProps) {
  return (
    <FlatList
      data={projects}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        gap: 10,
        paddingBottom: contentBottomInset,
      }}
      ListHeaderComponent={
        <View className="mb-1 flex-row flex-wrap items-center gap-2 px-4 pb-2 pt-1">
          <Text className="font-sans text-[11px] font-semibold uppercase leading-4 tracking-[0.08em] text-on-surface-variant">
            Recent projects
          </Text>
          <View className="rounded-full bg-surface-container-highest px-2 py-0.5">
            <Text className="font-sans text-[11px] font-semibold leading-4 text-on-surface-variant">
              {projects.length} Projects
            </Text>
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <ProjectListRow project={item} onPress={onProjectPress} />
      )}
      ListEmptyComponent={
        <View className="items-center gap-2 px-8 py-16">
          <Text variant="title-md" className="text-on-surface">
            No recent projects
          </Text>
          <Text variant="body-md" className="text-center text-on-surface-variant">
            Create a project to start organizing takes.
          </Text>
        </View>
      }
    />
  );
}
