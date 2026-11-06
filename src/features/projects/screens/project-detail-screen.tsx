import { MoreVertical } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/core/api/errors';
import { ScreenHeader } from '@/shared/components/layout/screen-header';
import { useFeedbackDialog } from '@/shared/components/ui/feedback-dialog';
import { Text } from '@/shared/components/ui/text';

import {
  useAttachProjectTracks,
  useDeleteProject,
  useProject,
  useUnlinkProjectTrack,
} from '../api/hooks';
import { ProjectAddActions } from '../components/project-add-actions';
import { ProjectAttachTracksSheet } from '../components/project-attach-tracks-sheet';
import { ProjectOverviewCard } from '../components/project-overview-card';
import { ProjectTrackRow } from '../components/project-track-row';
import type { ProjectTrack } from '../types';
import { mapProjectDetail } from '../utils/map-project';

/**
 * Project detail — identity → tracks → sticky studio actions.
 */
export function ProjectDetailScreen() {
  const insets = useSafeAreaInsets();
  const { back, canGoBack, replace } = useRouter();
  const { id, title: titleParam } = useLocalSearchParams<{
    id?: string;
    title?: string;
  }>();
  const projectId = typeof id === 'string' ? id : undefined;
  const { show, showError, confirm, dialog } = useFeedbackDialog();

  const projectQuery = useProject(projectId);
  const deleteProject = useDeleteProject();
  const attachTracks = useAttachProjectTracks();
  const unlinkTrack = useUnlinkProjectTrack();

  const [attachOpen, setAttachOpen] = useState(false);

  const project = projectQuery.data
    ? mapProjectDetail(projectQuery.data)
    : null;
  const headerTitle =
    (typeof titleParam === 'string' && titleParam.trim()) ||
    project?.title ||
    'Project';

  const leave = () => {
    if (canGoBack()) {
      back();
      return;
    }
    replace('/projects/' as Href);
  };

  const openProjectMenu = () => {
    if (!projectId) return;
    show({
      title: headerTitle,
      actions: [
        {
          label: 'Add existing tracks',
          variant: 'soft',
          onPress: () => setAttachOpen(true),
        },
        {
          label: 'Delete project…',
          variant: 'destructive',
          onPress: () => {
            show({
              title: 'Delete project?',
              message:
                'Keep the tracks in your library, or delete the tracks too.',
              actions: [
                { label: 'Cancel', variant: 'ghost' },
                {
                  label: 'Keep tracks',
                  variant: 'soft',
                  onPress: () => {
                    void deleteProject
                      .mutateAsync({ id: projectId, deleteTracks: false })
                      .then(leave)
                      .catch((error) => {
                        showError(
                          'Could not delete',
                          getErrorMessage(error, 'Try again.'),
                        );
                      });
                  },
                },
                {
                  label: 'Delete tracks too',
                  variant: 'destructive',
                  onPress: () => {
                    void deleteProject
                      .mutateAsync({ id: projectId, deleteTracks: true })
                      .then(leave)
                      .catch((error) => {
                        showError(
                          'Could not delete',
                          getErrorMessage(error, 'Try again.'),
                        );
                      });
                  },
                },
              ],
            });
          },
        },
        { label: 'Cancel', variant: 'ghost' },
      ],
    });
  };

  const onTrackMore = (track: ProjectTrack) => {
    if (!projectId) return;
    show({
      title: track.title,
      actions: [
        {
          label: 'Remove from project',
          variant: 'destructive',
          onPress: () => {
            confirm(
              'Remove from project?',
              'The track stays in your library.',
              {
                confirmLabel: 'Remove',
                destructive: true,
                onConfirm: () => {
                  void unlinkTrack
                    .mutateAsync({ projectId, trackId: track.id })
                    .catch((error) => {
                      showError(
                        'Could not remove',
                        getErrorMessage(error, 'Try again.'),
                      );
                    });
                },
              },
            );
          },
        },
        { label: 'Cancel', variant: 'ghost' },
      ],
    });
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title={headerTitle}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="More options"
            hitSlop={8}
            onPress={openProjectMenu}
            className="h-10 w-10 items-center justify-center rounded-full active:bg-surface-bright">
            <MoreVertical size={20} color="#E4E1EA" strokeWidth={2} />
          </Pressable>
        }
      />

      {projectQuery.isLoading && !project ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D0BCFF" />
        </View>
      ) : projectQuery.isError || !project || !projectId ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Text variant="title-md" className="text-on-surface">
            Couldn’t load project
          </Text>
          <Text variant="body-md" className="text-center text-on-surface-variant">
            {getErrorMessage(projectQuery.error, 'Try again in a moment.')}
          </Text>
          <Pressable
            onPress={() => {
              void projectQuery.refetch();
            }}
            className="rounded-full bg-surface-container px-4 py-2">
            <Text variant="label-md" className="text-on-surface">
              Retry
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView
            className="flex-1"
            contentContainerClassName="gap-8 px-5 pb-8 pt-6"
            showsVerticalScrollIndicator={false}>
            <ProjectOverviewCard project={project} />

            <View className="gap-4">
              <View className="flex-row items-center justify-between gap-3">
                <Text className="font-sans text-[12px] font-semibold uppercase leading-4 tracking-[0.08em] text-on-surface-variant">
                  Tracks
                </Text>
                <Text className="font-sans text-[12px] font-medium leading-4 text-on-surface-variant">
                  {project.tracks.length}{' '}
                  {project.tracks.length === 1 ? 'item' : 'items'}
                </Text>
              </View>

              {project.tracks.length === 0 ? (
                <View className="gap-2 rounded-2xl bg-surface-container px-4 py-6">
                  <Text variant="title-md" className="text-on-surface">
                    No tracks yet
                  </Text>
                  <Text variant="body-md" className="text-on-surface-variant">
                    Record something new below, or add existing takes from the
                    menu.
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {project.tracks.map((track) => (
                    <ProjectTrackRow
                      key={track.id}
                      track={track}
                      onMorePress={onTrackMore}
                    />
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          <ProjectAddActions projectId={projectId} />
        </>
      )}

      <ProjectAttachTracksSheet
        open={attachOpen}
        onOpenChange={setAttachOpen}
        attachedTrackIds={new Set(project?.tracks.map((t) => t.id) ?? [])}
        bottomOffset={Math.max(insets.bottom, 12)}
        isSubmitting={attachTracks.isPending}
        onAttach={(trackIds) => {
          if (!projectId) return;
          void attachTracks
            .mutateAsync({ id: projectId, body: { trackIds } })
            .then(() => setAttachOpen(false))
            .catch((error) => {
              showError(
                'Could not add tracks',
                getErrorMessage(error, 'Try again.'),
              );
            });
        }}
      />

      {dialog}
    </View>
  );
}

export default ProjectDetailScreen;
