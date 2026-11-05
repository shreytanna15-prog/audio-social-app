import { MoreVertical } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { ProjectAddActions } from '../components/project-add-actions';
import { ProjectOverviewCard } from '../components/project-overview-card';
import { ProjectTrackRow } from '../components/project-track-row';
import { getProjectDetailFixture } from '../data/projects.fixtures';
import { ScreenHeader } from '@/shared/components/layout/screen-header';
import { useFeedbackDialog } from '@/shared/components/ui/feedback-dialog';
import { Text } from '@/shared/components/ui/text';

/**
 * Project detail — identity → tracks → sticky studio actions.
 * Spacing-first: section gaps, roomy rows, docked thumb actions.
 */
export function ProjectDetailScreen() {
  const { id, title: titleParam } = useLocalSearchParams<{
    id?: string;
    title?: string;
  }>();
  const { showError, dialog } = useFeedbackDialog();

  const project = getProjectDetailFixture(typeof id === 'string' ? id : undefined);
  const headerTitle =
    (typeof titleParam === 'string' && titleParam.trim()) || project.title;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title={headerTitle}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="More options"
            hitSlop={8}
            onPress={() =>
              showError(headerTitle, 'Project options coming soon.')
            }
            className="h-10 w-10 items-center justify-center rounded-full active:bg-surface-bright">
            <MoreVertical size={20} color="#E4E1EA" strokeWidth={2} />
          </Pressable>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-8 px-5 pb-8 pt-6"
        showsVerticalScrollIndicator={false}>
        <ProjectOverviewCard
          project={{
            ...project,
            title: headerTitle,
          }}
        />

        <View className="gap-4">
          <View className="flex-row items-center justify-between gap-3">
            <Text
              className="font-sans text-[12px] font-semibold uppercase leading-4 tracking-[0.08em] text-on-surface-variant">
              Tracks
            </Text>
            <Text className="font-sans text-[12px] font-medium leading-4 text-on-surface-variant">
              {project.tracks.length}{' '}
              {project.tracks.length === 1 ? 'item' : 'items'}
            </Text>
          </View>

          <View className="gap-3">
            {project.tracks.map((track) => (
              <ProjectTrackRow key={track.id} track={track} />
            ))}
          </View>
        </View>
      </ScrollView>

      <ProjectAddActions />
      {dialog}
    </View>
  );
}

export default ProjectDetailScreen;
