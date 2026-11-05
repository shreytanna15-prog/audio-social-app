import { FlatList, View } from 'react-native';

import { ALL_PROJECTS, ProjectListRow, type ProjectSummary } from '@/features/projects';
import { Text } from '@/shared/components/ui/text';

import { LibrarySectionHeader } from './library-section-header';

type LibraryProjectsPanelProps = {
  /** Full project catalog (defaults to shared {@link ALL_PROJECTS}). */
  projects?: ProjectSummary[];
  onProjectPress: (project: ProjectSummary) => void;
  contentBottomInset?: number;
};

/**
 * Library → Projects: full list shell (filters can land here later).
 * Shares {@link ProjectListRow} with Recent projects; different list chrome.
 */
export function LibraryProjectsPanel({
  projects = ALL_PROJECTS,
  onProjectPress,
  contentBottomInset = 28,
}: LibraryProjectsPanelProps) {
  return (
    <FlatList
      className="flex-1"
      data={projects}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        gap: 10,
        paddingBottom: contentBottomInset,
      }}
      ListHeaderComponent={
        <View className="mb-1 pb-2">
          <LibrarySectionHeader label="All projects" count={projects.length} />
        </View>
      }
      renderItem={({ item }) => (
        <ProjectListRow project={item} onPress={onProjectPress} />
      )}
      ListEmptyComponent={
        <View className="items-center gap-2 px-8 py-16">
          <Text variant="title-md" className="text-on-surface">
            No projects yet
          </Text>
          <Text variant="body-md" className="text-center text-on-surface-variant">
            Create a project from the + menu to start organizing takes.
          </Text>
        </View>
      }
    />
  );
}
