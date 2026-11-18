import { ActivityIndicator, FlatList, View } from 'react-native';

import { ProjectListRow, type ProjectSummary } from '@/features/projects';
import { Text } from '@/shared/components/ui/text';

import { LibrarySectionHeader } from './library-section-header';

type LibraryProjectsPanelProps = {
  projects: ProjectSummary[];
  onProjectPress: (project: ProjectSummary) => void;
  onMorePress?: (project: ProjectSummary) => void;
  contentBottomInset?: number;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
};

/**
 * Library → Projects: full list shell (filters can land here later).
 * Shares {@link ProjectListRow} with Recent projects; different list chrome.
 */
export function LibraryProjectsPanel({
  projects,
  onProjectPress,
  onMorePress,
  contentBottomInset = 28,
  isLoading = false,
  isError = false,
  onRetry,
}: LibraryProjectsPanelProps) {
  if (isLoading && projects.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <ActivityIndicator color="#D0BCFF" />
      </View>
    );
  }

  if (isError && projects.length === 0) {
    return (
      <View className="flex-1 items-center gap-3 px-8 py-16">
        <Text variant="title-md" className="text-on-surface">
          Couldn’t load projects
        </Text>
        {onRetry ? (
          <Text
            variant="body-md"
            className="text-primary"
            onPress={onRetry}>
            Retry
          </Text>
        ) : null}
      </View>
    );
  }

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
        <View className="mb-2 pb-1 pt-1">
          <LibrarySectionHeader label="Projects" />
        </View>
      }
      renderItem={({ item }) => (
        <ProjectListRow
          project={item}
          onPress={onProjectPress}
          onMorePress={onMorePress}
        />
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
