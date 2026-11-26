import { AudioLines, FolderMinus, FolderPlus, MoreVertical, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/core/api/errors';
import { loadProjectBundle } from '@/features/audio/data/project-repository';
import { useMultitrackEntryStore } from '@/features/studio/store/multitrack-entry.store';
import { useQuickRecordStore } from '@/features/studio/store/quick-record.store';
import { useDeleteTrack } from '@/features/tracks';
import { restoreTrack } from '@/features/tracks/api/restore-track';
import { hasLocalProject } from '@/features/tracks/utils/resolve-local-track';
import { ActionsDialog } from '@/shared/components/ui/actions-dialog';
import { ScreenHeader } from '@/shared/components/layout/screen-header';
import { useFeedbackDialog } from '@/shared/components/ui/feedback-dialog';
import { Text } from '@/shared/components/ui/text';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

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
  const { back, canGoBack, replace, push } = useRouter();
  const { guard } = useNavigationGuard();
  const hydrateFromImport = useQuickRecordStore((s) => s.hydrateFromImport);
  const { id, title: titleParam, from } = useLocalSearchParams<{
    id?: string;
    title?: string;
    from?: string | string[];
  }>();
  const projectId = typeof id === 'string' ? id : undefined;
  const openedFrom = Array.isArray(from) ? from[0] : from;
  const { showError, confirm, dialog } = useFeedbackDialog();

  const projectQuery = useProject(projectId);
  const deleteProject = useDeleteProject();
  const deleteTrack = useDeleteTrack();
  const attachTracks = useAttachProjectTracks();
  const unlinkTrack = useUnlinkProjectTrack();

  const [attachOpen, setAttachOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [menuTrack, setMenuTrack] = useState<ProjectTrack | null>(null);

  const project = projectQuery.data
    ? mapProjectDetail(projectQuery.data)
    : null;
  const headerTitle =
    (typeof titleParam === 'string' && titleParam.trim()) ||
    project?.title ||
    'Project';

  const leave = () => {
    if (openedFrom === 'home') {
      guard(() => replace('/(tabs)' as Href));
      return;
    }
    if (canGoBack()) {
      guard(() => back());
      return;
    }
    guard(() => replace('/projects/' as Href));
  };

  const runDeleteProject = (deleteTracks: boolean) => {
    if (!projectId) return;
    void deleteProject
      .mutateAsync({ id: projectId, deleteTracks })
      .then(() => {
        setDeleteOpen(false);
        leave();
      })
      .catch((error) => {
        showError(
          'Could not delete',
          getErrorMessage(error, 'Try again.'),
        );
      });
  };

  const onTrackMore = (track: ProjectTrack) => {
    setMenuTrack(track);
  };

  const openTrackInStudio = async (track: ProjectTrack) => {
    let storageState: 'LOCAL_ONLY' | 'SYNCED' =
      track.storageState === 'SYNCED' ? 'SYNCED' : 'LOCAL_ONLY';

    if (!hasLocalProject(track.id)) {
      try {
        await restoreTrack(track.id);
        storageState = 'SYNCED';
      } catch (error) {
        showError(
          'Could not download',
          getErrorMessage(error, 'Try again in a moment.'),
        );
        return;
      }
    }

    const loaded = await loadProjectBundle(track.id);
    if (!loaded) {
      showError(track.title, 'Could not load this take locally.');
      return;
    }

    if (track.kind === 'MULTI') {
      useMultitrackEntryStore.getState().setPendingEntry({
        project: loaded.project,
        trackId: track.id,
        title: loaded.title || track.title,
        storageState,
      });
      guard(() =>
        push({
          pathname: '/studio/multitrack',
          params: { projectId },
        } as Href),
      );
      return;
    }

    hydrateFromImport(loaded.project, loaded.title || track.title, track.id);
    guard(() =>
      push({
        pathname: '/studio/quick-record/edit',
        params: { storageState, projectId, discardTarget: 'library' },
      } as Href),
    );
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
            onPress={() => {
              if (!projectId) return;
              setMenuOpen(true);
            }}
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
                <View className="items-center justify-center py-12 px-4 gap-2.5">
                  <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/4 mb-1">
                    <AudioLines size={24} color="#79747E" />
                  </View>
                  <Text className="text-[15px] font-medium text-on-surface">
                    No tracks yet
                  </Text>
                  <Text className="text-[13px] text-center text-on-surface-variant max-w-60 leading-5">
                    Record a take or import audio using the studio tools below.
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {project.tracks.map((track) => (
                    <ProjectTrackRow
                      key={track.id}
                      track={track}
                      onPress={openTrackInStudio}
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

      <ActionsDialog
        open={menuOpen}
        onOpenChange={setMenuOpen}
        variant="menu"
        title={headerTitle}
        actions={[
          {
            key: 'add',
            label: 'Add existing tracks',
            icon: FolderPlus,
            onPress: () => {
              setMenuOpen(false);
              setAttachOpen(true);
            },
          },
        ]}
        destructiveAction={{
          label: 'Delete project',
          icon: Trash2,
          onPress: () => {
            setMenuOpen(false);
            setDeleteOpen(true);
          },
        }}
      />

      <ActionsDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        variant="confirm"
        title="Delete project?"
        message="Keep the tracks in your library, or delete the tracks too."
        busy={deleteProject.isPending}
        actions={[
          {
            key: 'keep',
            label: deleteProject.isPending ? 'Deleting…' : 'Keep tracks',
            onPress: () => runDeleteProject(false),
          },
          {
            key: 'delete-tracks',
            label: 'Delete tracks too',
            variant: 'destructive',
            onPress: () => runDeleteProject(true),
          },
        ]}
      />

      <ActionsDialog
        open={menuTrack != null}
        onOpenChange={(open) => {
          if (!open) setMenuTrack(null);
        }}
        variant="menu"
        title={menuTrack?.title ?? ''}
        actions={[
          {
            key: 'remove',
            label: 'Remove from project',
            icon: FolderMinus,
            onPress: () => {
              if (!projectId || !menuTrack) return;
              const track = menuTrack;
              setMenuTrack(null);
              confirm(
                'Remove from project?',
                'The track stays in your library.',
                {
                  confirmLabel: 'Remove',
                  pendingLabel: 'Removing…',
                  destructive: true,
                  onConfirm: async () => {
                    try {
                      await unlinkTrack.mutateAsync({
                        projectId,
                        trackId: track.id,
                      });
                    } catch (error) {
                      showError(
                        'Could not remove',
                        getErrorMessage(error, 'Try again.'),
                      );
                      throw error;
                    }
                  },
                },
              );
            },
          },
        ]}
        destructiveAction={{
          label: 'Delete track permanently',
          icon: Trash2,
          onPress: () => {
            if (!menuTrack) return;
            const track = menuTrack;
            setMenuTrack(null);
            confirm(
              'Delete track?',
              'This permanently removes the track and its audio from your library and projects.',
              {
                confirmLabel: 'Delete',
                pendingLabel: 'Deleting…',
                destructive: true,
                onConfirm: async () => {
                  try {
                    await deleteTrack.mutateAsync(track.id);
                    void projectQuery.refetch();
                  } catch (error) {
                    showError(
                      'Could not delete track',
                      getErrorMessage(error, 'Try again.'),
                    );
                    throw error;
                  }
                },
              },
            );
          },
        }}
      />

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
