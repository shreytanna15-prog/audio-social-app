import { useCallback, useMemo, useState } from 'react';
import { type Href, useFocusEffect, useRouter } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/core/api/errors';
import { loadProjectById } from '@/features/audio/data/project-repository';
import { useProjects } from '@/features/projects/api/hooks';
import { mapProjectSummary } from '@/features/projects/utils/map-project';
import { useMultitrackEntryStore } from '@/features/studio/store/multitrack-entry.store';
import { useQuickRecordStore } from '@/features/studio/store/quick-record.store';
import { useStudioProjectContextStore } from '@/features/studio/store/studio-project-context.store';
import {
  useBackupTrack,
  useDeleteTrack,
  useTracks,
  useUnpublishTrack,
} from '@/features/tracks';
import { hasLocalProject } from '@/features/tracks/utils/resolve-local-track';
import { ScreenHeader } from '@/shared/components/layout/screen-header';
import { useFeedbackDialog } from '@/shared/components/ui/feedback-dialog';

import { LibraryAddButton } from '../components/library-add-button';
import { LibraryAlbumsPanel } from '../components/library-albums-panel';
import { LibraryAudioPanel } from '../components/library-audio-panel';
import { LibraryPlaylistsPanel } from '../components/library-playlists-panel';
import { LibraryProjectsPanel } from '../components/library-projects-panel';
import { LibrarySegmentTabs } from '../components/library-segment-tabs';
import { PublishTrackSheet } from '../components/publish-track-sheet';
import {
  LIBRARY_ALBUM_ITEMS,
  LIBRARY_PLAYLIST_ITEMS,
} from '../data/library.fixtures';
import type { LibraryAudioFilter, LibraryAudioItem, LibraryTab } from '../types';
import { mapTrackToLibraryItem } from '../utils/map-track-to-library-item';

export function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const { push, replace } = useRouter();
  const [activeTab, setActiveTab] = useState<LibraryTab>('audio');
  const [audioFilter, setAudioFilter] = useState<LibraryAudioFilter>('all');
  const [publishTrack, setPublishTrack] = useState<LibraryAudioItem | null>(
    null,
  );
  const listBottomInset = Math.max(insets.bottom, 16) + 28;
  const { show, showError, confirm, dialog } = useFeedbackDialog();

  const tracksQuery = useTracks();
  const projectsQuery = useProjects();
  const deleteTrack = useDeleteTrack();
  const backupTrack = useBackupTrack();
  const unpublishTrack = useUnpublishTrack();
  const hydrateFromImport = useQuickRecordStore((s) => s.hydrateFromImport);
  const setPendingProject = useMultitrackEntryStore((s) => s.setPendingProject);
  const clearProjectId = useStudioProjectContextStore((s) => s.clearProjectId);

  const refetchTracks = tracksQuery.refetch;
  const refetchProjects = projectsQuery.refetch;

  useFocusEffect(
    useCallback(() => {
      void refetchTracks();
      void refetchProjects();
    }, [refetchProjects, refetchTracks]),
  );

  const audioItems = useMemo(
    () => (tracksQuery.data ?? []).map(mapTrackToLibraryItem),
    [tracksQuery.data],
  );

  const projectItems = useMemo(
    () => (projectsQuery.data ?? []).map(mapProjectSummary),
    [projectsQuery.data],
  );

  const openCreate = () => {
    clearProjectId();
    show({
      title: 'Add to library',
      actions: [
        { label: 'Cancel', variant: 'ghost' },
        {
          label: 'Quick Record',
          variant: 'soft',
          onPress: () => push('/studio/quick-record' as Href),
        },
        {
          label: 'Multitrack',
          variant: 'soft',
          onPress: () => push('/studio/multitrack' as Href),
        },
        {
          label: 'New project',
          variant: 'soft',
          onPress: () => push('/projects/' as Href),
        },
      ],
    });
  };

  const removeUnavailable = (item: LibraryAudioItem) => {
    confirm(
      'Remove from library?',
      'Audio files are missing on this device and were never backed up. This removes the library entry.',
      {
        confirmLabel: 'Remove',
        destructive: true,
        onConfirm: () => {
          void deleteTrack.mutateAsync(item.id).catch((error) => {
            showError(
              'Could not remove',
              getErrorMessage(error, 'Try again.'),
            );
          });
        },
      },
    );
  };

  const backupItem = (item: LibraryAudioItem) => {
    void backupTrack
      .mutateAsync({ trackId: item.id })
      .then(() => {
        showError('Backed up', 'This take is synced to the cloud.');
      })
      .catch((error) => {
        showError(
          'Backup failed',
          getErrorMessage(error, 'Check your connection and try again.'),
        );
      });
  };

  const openEditorForItem = (item: LibraryAudioItem) => {
    void (async () => {
      const project = await loadProjectById(item.id);
      if (!project) {
        showError(item.title, 'Could not load this take locally.');
        return;
      }

      if (item.kind === 'MULTI') {
        setPendingProject(project);
        push('/studio/multitrack' as Href);
        return;
      }

      hydrateFromImport(project, item.title);
      push('/studio/quick-record/edit' as Href);
    })();
  };

  const openAudioItem = (item: LibraryAudioItem) => {
    if (item.unavailable) {
      removeUnavailable(item);
      return;
    }

    if (!hasLocalProject(item.id) && !item.localUri) {
      showError(item.title, 'Opening this take is not available yet.');
      return;
    }

    if (item.status === 'PUBLISHED') {
      confirm(
        'Unpublish to edit?',
        'Published tracks are frozen. Unpublish first to open the editor.',
        {
          confirmLabel: 'Unpublish',
          onConfirm: () => {
            void unpublishTrack
              .mutateAsync(item.id)
              .then(() => openEditorForItem(item))
              .catch((error) => {
                showError(
                  'Could not unpublish',
                  getErrorMessage(error, 'Try again.'),
                );
              });
          },
        },
      );
      return;
    }

    openEditorForItem(item);
  };

  const onMorePress = (item: LibraryAudioItem) => {
    if (item.unavailable) {
      removeUnavailable(item);
      return;
    }

    const actions = [];

    if (item.storageState === 'LOCAL_ONLY' && item.localUri) {
      actions.push({
        label: backupTrack.isPending ? 'Backing up…' : 'Back up to cloud',
        onPress: () => backupItem(item),
      });
    }

    if (item.status === 'DRAFT' && item.storageState === 'SYNCED') {
      actions.push({
        label: 'Publish…',
        onPress: () => setPublishTrack(item),
      });
    }

    if (item.status === 'PUBLISHED') {
      actions.push({
        label: 'Unpublish',
        onPress: () => {
          confirm(
            'Unpublish track?',
            'It will return to draft and leave the public feed.',
            {
              confirmLabel: 'Unpublish',
              destructive: true,
              onConfirm: () => {
                void unpublishTrack.mutateAsync(item.id).catch((error) => {
                  showError(
                    'Could not unpublish',
                    getErrorMessage(error, 'Try again.'),
                  );
                });
              },
            },
          );
        },
      });
    }

    actions.push({
      label: 'Delete',
      variant: 'destructive' as const,
      onPress: () => {
        void deleteTrack.mutateAsync(item.id).catch((error) => {
          showError('Could not delete', getErrorMessage(error, 'Try again.'));
        });
      },
    });
    actions.push({ label: 'Cancel', variant: 'ghost' as const });

    show({ title: item.title, actions });
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title="Library"
        onBack={() => replace('/(tabs)/profile' as Href)}
        right={<LibraryAddButton onPress={openCreate} />}
      />

      <View className="pb-3">
        <LibrarySegmentTabs activeTab={activeTab} onChange={setActiveTab} />
      </View>

      <View className="min-h-0 flex-1">
        {activeTab === 'audio' ? (
          <LibraryAudioPanel
            items={audioItems}
            filter={audioFilter}
            onFilterChange={setAudioFilter}
            contentBottomInset={listBottomInset}
            isLoading={tracksQuery.isLoading && audioItems.length === 0}
            isError={tracksQuery.isError}
            onRetry={() => {
              void tracksQuery.refetch();
            }}
            onItemPress={openAudioItem}
            onMorePress={onMorePress}
          />
        ) : null}

        {activeTab === 'projects' ? (
          <LibraryProjectsPanel
            projects={projectItems}
            contentBottomInset={listBottomInset}
            isLoading={projectsQuery.isLoading}
            isError={projectsQuery.isError}
            onRetry={() => {
              void projectsQuery.refetch();
            }}
            onProjectPress={(project) =>
              push({
                pathname: '/projects/[id]',
                params: { id: project.id, title: project.title },
              })
            }
          />
        ) : null}

        {activeTab === 'albums' ? (
          <LibraryAlbumsPanel
            items={LIBRARY_ALBUM_ITEMS}
            contentBottomInset={listBottomInset}
          />
        ) : null}

        {activeTab === 'playlists' ? (
          <LibraryPlaylistsPanel
            items={LIBRARY_PLAYLIST_ITEMS}
            contentBottomInset={listBottomInset}
          />
        ) : null}
      </View>

      <PublishTrackSheet
        open={publishTrack != null}
        onOpenChange={(open) => {
          if (!open) setPublishTrack(null);
        }}
        track={publishTrack}
        bottomOffset={Math.max(insets.bottom, 12)}
        onPublished={() => {
          showError('Published', 'Your track is live.');
        }}
        onError={showError}
      />

      {dialog}
    </View>
  );
}
