import { useCallback, useMemo, useState } from 'react';
import { type Href, useFocusEffect, useRouter } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/core/api/errors';
import { useAlbums, useCreateAlbum, useDeleteAlbum } from '@/features/albums';
import { loadProjectById } from '@/features/audio/data/project-repository';
import {
  useCreatePlaylist,
  useDeletePlaylist,
  usePlaylists,
} from '@/features/playlists';
import { useDeleteProject, useProjects } from '@/features/projects/api/hooks';
import type { ProjectSummary } from '@/features/projects';
import { mapProjectSummary } from '@/features/projects/utils/map-project';
import { usePlayerStore } from '@/features/player';
import {
  useLikedTracks,
  useSavedAlbums,
  useSavedPlaylists,
  useUnlikeTrack,
  useUnsaveAlbum,
  useUnsavePlaylist,
} from '@/features/saves';
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
import { LibraryCreateCollectionDialog } from '../components/library-create-collection-dialog';
import { LibraryPlaylistsPanel } from '../components/library-playlists-panel';
import { LibraryProjectsPanel } from '../components/library-projects-panel';
import { LibrarySavedPanel } from '../components/library-saved-panel';
import { LibrarySegmentTabs } from '../components/library-segment-tabs';
import { PublishTrackSheet } from '../components/publish-track-sheet';
import type {
  LibraryAlbumItem,
  LibraryAudioFilter,
  LibraryAudioItem,
  LibraryLikedTrackItem,
  LibraryPlaylistItem,
  LibraryPlaylistVisibility,
  LibrarySavedCollectionItem,
  LibraryTab,
} from '../types';
import {
  mapAlbumToLibraryItem,
  mapPlaylistToLibraryItem,
  mapSavedAlbumToLibraryItem,
  mapSavedPlaylistToLibraryItem,
} from '../utils/map-collections-to-library-items';
import { mapLikedTrackToLibraryItem } from '../utils/map-liked-track-to-library-item';
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
  const likedTracksQuery = useLikedTracks();
  const unlikeTrack = useUnlikeTrack();
  const playlistsQuery = usePlaylists();
  const albumsQuery = useAlbums();
  const savedPlaylistsQuery = useSavedPlaylists();
  const savedAlbumsQuery = useSavedAlbums();
  const createPlaylist = useCreatePlaylist();
  const createAlbum = useCreateAlbum();
  const deletePlaylist = useDeletePlaylist();
  const deleteAlbum = useDeleteAlbum();
  const deleteProject = useDeleteProject();
  const unsavePlaylist = useUnsavePlaylist();
  const unsaveAlbum = useUnsaveAlbum();
  const [createKind, setCreateKind] = useState<'playlist' | 'album' | null>(
    null,
  );
  const play = usePlayerStore((s) => s.play);
  const hydrateFromImport = useQuickRecordStore((s) => s.hydrateFromImport);
  const setPendingProject = useMultitrackEntryStore((s) => s.setPendingProject);
  const clearProjectId = useStudioProjectContextStore((s) => s.clearProjectId);

  const refetchTracks = tracksQuery.refetch;
  const refetchProjects = projectsQuery.refetch;
  const refetchLikedTracks = likedTracksQuery.refetch;
  const refetchPlaylists = playlistsQuery.refetch;
  const refetchAlbums = albumsQuery.refetch;
  const refetchSavedPlaylists = savedPlaylistsQuery.refetch;
  const refetchSavedAlbums = savedAlbumsQuery.refetch;

  useFocusEffect(
    useCallback(() => {
      void refetchTracks();
      void refetchProjects();
      void refetchLikedTracks();
      void refetchPlaylists();
      void refetchAlbums();
      void refetchSavedPlaylists();
      void refetchSavedAlbums();
    }, [
      refetchAlbums,
      refetchLikedTracks,
      refetchPlaylists,
      refetchProjects,
      refetchSavedAlbums,
      refetchSavedPlaylists,
      refetchTracks,
    ]),
  );

  const audioItems = useMemo(
    () => (tracksQuery.data ?? []).map(mapTrackToLibraryItem),
    [tracksQuery.data],
  );

  const projectItems = useMemo(
    () => (projectsQuery.data ?? []).map(mapProjectSummary),
    [projectsQuery.data],
  );

  const likedItems = useMemo(
    () =>
      (likedTracksQuery.data ?? []).flatMap((dto) => {
        const item = mapLikedTrackToLibraryItem(dto);
        return item ? [item] : [];
      }),
    [likedTracksQuery.data],
  );

  const playlistItems = useMemo(
    () => (playlistsQuery.data ?? []).map(mapPlaylistToLibraryItem),
    [playlistsQuery.data],
  );

  const albumItems = useMemo(
    () => (albumsQuery.data ?? []).map(mapAlbumToLibraryItem),
    [albumsQuery.data],
  );

  const savedPlaylistItems = useMemo(
    () => (savedPlaylistsQuery.data ?? []).map(mapSavedPlaylistToLibraryItem),
    [savedPlaylistsQuery.data],
  );

  const savedAlbumItems = useMemo(
    () => (savedAlbumsQuery.data ?? []).map(mapSavedAlbumToLibraryItem),
    [savedAlbumsQuery.data],
  );

  const submitCreateCollection = (input: {
    title: string;
    visibility: LibraryPlaylistVisibility;
  }) => {
    if (!input.title) {
      showError('Title required', 'Give it a name.');
      return;
    }

    if (createKind === 'playlist') {
      void createPlaylist
        .mutateAsync({
          title: input.title,
          visibility: input.visibility === 'public' ? 'PUBLIC' : 'PRIVATE',
        })
        .then(() => setCreateKind(null))
        .catch((error) => {
          showError(
            'Could not create playlist',
            getErrorMessage(error, 'Try again.'),
          );
        });
      return;
    }

    void createAlbum
      .mutateAsync({ title: input.title })
      .then(() => setCreateKind(null))
      .catch((error) => {
        showError(
          'Could not create album',
          getErrorMessage(error, 'Try again.'),
        );
      });
  };

  const openPlaylist = (item: LibraryPlaylistItem) => {
    push({
      pathname: '/playlists/[id]',
      params: { id: item.id, title: item.title },
    });
  };

  const openAlbum = (item: LibraryAlbumItem) => {
    push({
      pathname: '/albums/[id]',
      params: { id: item.id, title: item.title },
    });
  };

  const openProject = (project: ProjectSummary) => {
    push({
      pathname: '/projects/[id]',
      params: { id: project.id, title: project.title },
    });
  };

  const openPlaylistMenu = (item: LibraryPlaylistItem) => {
    show({
      title: item.title,
      actions: [
        {
          label: 'Open',
          variant: 'soft',
          onPress: () => openPlaylist(item),
        },
        {
          label: 'Delete playlist…',
          variant: 'destructive',
          onPress: () => {
            confirm(
              'Delete playlist?',
              'Tracks stay in your library. Only the playlist is removed.',
              {
                confirmLabel: 'Delete',
                destructive: true,
                onConfirm: () => {
                  void deletePlaylist.mutateAsync(item.id).catch((error) => {
                    showError(
                      'Could not delete',
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

  const openAlbumMenu = (item: LibraryAlbumItem) => {
    show({
      title: item.title,
      actions: [
        {
          label: 'Open',
          variant: 'soft',
          onPress: () => openAlbum(item),
        },
        {
          label: 'Delete album…',
          variant: 'destructive',
          onPress: () => {
            confirm(
              'Delete album?',
              'Tracks stay published as singles. Only the album is removed.',
              {
                confirmLabel: 'Delete',
                destructive: true,
                onConfirm: () => {
                  void deleteAlbum.mutateAsync(item.id).catch((error) => {
                    showError(
                      'Could not delete',
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

  const openProjectMenu = (project: ProjectSummary) => {
    show({
      title: project.title,
      actions: [
        {
          label: 'Open',
          variant: 'soft',
          onPress: () => openProject(project),
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
                      .mutateAsync({ id: project.id, deleteTracks: false })
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
                      .mutateAsync({ id: project.id, deleteTracks: true })
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

  const openSavedCollection = (item: LibrarySavedCollectionItem) => {
    if (!item.available) {
      showError(item.title, 'This is no longer available.');
      return;
    }

    push({
      pathname: item.kind === 'playlist' ? '/playlists/[id]' : '/albums/[id]',
      params: { id: item.id, title: item.title },
    });
  };

  const openSavedCollectionMenu = (item: LibrarySavedCollectionItem) => {
    const unsave = item.kind === 'playlist' ? unsavePlaylist : unsaveAlbum;

    show({
      title: item.title,
      actions: [
        { label: 'Cancel', variant: 'ghost' },
        {
          label: 'Remove from saved',
          variant: 'destructive',
          onPress: () => {
            void unsave.mutateAsync(item.id).catch((error) => {
              showError(
                'Could not remove',
                getErrorMessage(error, 'Try again.'),
              );
            });
          },
        },
      ],
    });
  };

  const openLikedTrack = (item: LibraryLikedTrackItem) => {
    if (!item.available) {
      showError(item.title, 'This track is no longer available.');
      return;
    }

    play({
      id: item.id,
      title: item.title,
      artist: item.artist,
      coverUrl: item.coverUrl ?? '',
      artistAvatarUrl: item.artistAvatarUrl,
      likeCountLabel: String(item.likeCount),
      durationSec: item.durationSec,
    });
  };

  const unlikeItem = (item: LibraryLikedTrackItem) => {
    void unlikeTrack.mutateAsync(item.id).catch((error) => {
      showError('Could not unlike', getErrorMessage(error, 'Try again.'));
    });
  };

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
            onProjectPress={openProject}
            onMorePress={openProjectMenu}
          />
        ) : null}

        {activeTab === 'albums' ? (
          <LibraryAlbumsPanel
            items={albumItems}
            contentBottomInset={listBottomInset}
            isLoading={albumsQuery.isLoading}
            isError={albumsQuery.isError}
            onRetry={() => {
              void albumsQuery.refetch();
            }}
            onItemPress={openAlbum}
            onMorePress={openAlbumMenu}
            onCreatePress={() => setCreateKind('album')}
          />
        ) : null}

        {activeTab === 'playlists' ? (
          <LibraryPlaylistsPanel
            items={playlistItems}
            contentBottomInset={listBottomInset}
            isLoading={playlistsQuery.isLoading}
            isError={playlistsQuery.isError}
            onRetry={() => {
              void playlistsQuery.refetch();
            }}
            onItemPress={openPlaylist}
            onMorePress={openPlaylistMenu}
            onCreatePress={() => setCreateKind('playlist')}
          />
        ) : null}

        {activeTab === 'saved' ? (
          <LibrarySavedPanel
            likedTracks={likedItems}
            savedPlaylists={savedPlaylistItems}
            savedAlbums={savedAlbumItems}
            playlistsState={{
              isLoading: savedPlaylistsQuery.isLoading,
              isError: savedPlaylistsQuery.isError,
              onRetry: () => {
                void savedPlaylistsQuery.refetch();
              },
            }}
            albumsState={{
              isLoading: savedAlbumsQuery.isLoading,
              isError: savedAlbumsQuery.isError,
              onRetry: () => {
                void savedAlbumsQuery.refetch();
              },
            }}
            onTrackPress={openLikedTrack}
            onUnlikePress={unlikeItem}
            onCollectionPress={openSavedCollection}
            onCollectionMorePress={openSavedCollectionMenu}
            contentBottomInset={listBottomInset}
            isLoading={likedTracksQuery.isLoading}
            isError={likedTracksQuery.isError}
            onRetry={() => {
              void likedTracksQuery.refetch();
            }}
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

      <LibraryCreateCollectionDialog
        key={createKind ?? 'closed'}
        kind={createKind ?? 'playlist'}
        open={createKind != null}
        onOpenChange={(open) => {
          if (!open) setCreateKind(null);
        }}
        isPending={createPlaylist.isPending || createAlbum.isPending}
        onSubmit={submitCreateCollection}
      />

      {dialog}
    </View>
  );
}
