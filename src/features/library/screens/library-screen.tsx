import { FolderOpen, Pencil, Trash2 } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
  type Href,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/core/api/errors';
import { useAlbums, useCreateAlbum, useDeleteAlbum } from '@/features/albums';
import { loadProjectBundle } from '@/features/audio/data/project-repository';
import {
  useCreatePlaylist,
  useDeletePlaylist,
  usePlaylists,
} from '@/features/playlists';
import {
  useDeleteProject,
  useProjects,
  useUpdateProject,
} from '@/features/projects/api/hooks';
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
import { useDeleteFeedClip } from '@/features/feed';
import {
  restoreTrack,
  useBackupTrack,
  useDeleteTrack,
  useTracks,
  useUnpublishTrack,
} from '@/features/tracks';
import { hasLocalProject } from '@/features/tracks/utils/resolve-local-track';
import { ActionsDialog } from '@/shared/components/ui/actions-dialog';
import { ScreenHeader } from '@/shared/components/layout/screen-header';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { useFeedbackDialog } from '@/shared/components/ui/feedback-dialog';
import { Input } from '@/shared/components/ui/input';
import { Text } from '@/shared/components/ui/text';

import { LibraryAlbumsPanel } from '../components/library-albums-panel';
import { LibraryAudioPanel } from '../components/library-audio-panel';
import { LibraryCreateCollectionDialog } from '../components/library-create-collection-dialog';
import { LibraryPlaylistsPanel } from '../components/library-playlists-panel';
import { LibraryProjectsPanel } from '../components/library-projects-panel';
import { LibrarySavedPanel } from '../components/library-saved-panel';
import { LibrarySegmentTabs } from '../components/library-segment-tabs';
import { PublishTrackSheet } from '../components/publish-track-sheet';
import { TrackActionsDialog } from '../components/track-actions-dialog';
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
  const { from } = useLocalSearchParams<{ from?: string | string[] }>();
  const openedFrom = Array.isArray(from) ? from[0] : from;
  const [activeTab, setActiveTab] = useState<LibraryTab>('audio');
  const [audioFilter, setAudioFilter] = useState<LibraryAudioFilter>('all');
  const [publishTrack, setPublishTrack] = useState<LibraryAudioItem | null>(
    null,
  );
  const [menuTrackId, setMenuTrackId] = useState<string | null>(null);
  const [menuPlaylist, setMenuPlaylist] = useState<LibraryPlaylistItem | null>(null);
  const [menuAlbum, setMenuAlbum] = useState<LibraryAlbumItem | null>(null);
  const [menuProject, setMenuProject] = useState<ProjectSummary | null>(null);
  const [renameTarget, setRenameTarget] = useState<ProjectSummary | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [deleteProjectTarget, setDeleteProjectTarget] = useState<ProjectSummary | null>(null);
  const [menuSavedCollection, setMenuSavedCollection] = useState<LibrarySavedCollectionItem | null>(null);
  const listBottomInset = Math.max(insets.bottom, 16) + 28;
  const { show, showError, confirm, dialog } = useFeedbackDialog();

  const tracksQuery = useTracks();
  const projectsQuery = useProjects();
  const deleteTrack = useDeleteTrack();
  const backupTrack = useBackupTrack();
  const unpublishTrack = useUnpublishTrack();
  const deleteFeedClip = useDeleteFeedClip();
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
  const updateProject = useUpdateProject();
  const unsavePlaylist = useUnsavePlaylist();
  const unsaveAlbum = useUnsaveAlbum();
  const [createKind, setCreateKind] = useState<'playlist' | 'album' | null>(
    null,
  );
  const play = usePlayerStore((s) => s.play);
  const hydrateFromImport = useQuickRecordStore((s) => s.hydrateFromImport);

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

  const menuTrack = useMemo(
    () =>
      menuTrackId
        ? (audioItems.find((item) => item.id === menuTrackId) ?? null)
        : null,
    [audioItems, menuTrackId],
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
    setMenuPlaylist(item);
  };

  const openAlbumMenu = (item: LibraryAlbumItem) => {
    setMenuAlbum(item);
  };

  const openProjectMenu = (project: ProjectSummary) => {
    setMenuProject(project);
  };

  const runDeleteProject = (project: ProjectSummary, deleteTracks: boolean) => {
    void deleteProject
      .mutateAsync({ id: project.id, deleteTracks })
      .then(() => setDeleteProjectTarget(null))
      .catch((error) => {
        showError('Could not delete', getErrorMessage(error, 'Try again.'));
      });
  };

  const submitRename = () => {
    if (!renameTarget) return;
    const trimmed = renameTitle.trim();
    if (!trimmed) {
      showError('Title required', 'Give your project a name.');
      return;
    }
    void updateProject
      .mutateAsync({ id: renameTarget.id, body: { title: trimmed } })
      .then(() => setRenameTarget(null))
      .catch((error) => {
        showError('Could not rename project', getErrorMessage(error, 'Try again.'));
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
    setMenuSavedCollection(item);
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

  const removeUnavailable = (item: LibraryAudioItem) => {
    confirm(
      'Remove from library?',
      'Audio files are missing on this device and were never backed up. This removes the library entry.',
      {
        confirmLabel: 'Remove',
        pendingLabel: 'Removing…',
        destructive: true,
        onConfirm: async () => {
          try {
            await deleteTrack.mutateAsync(item.id);
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
  };

  const closeTrackMenu = () => setMenuTrackId(null);

  const backupFromMenu = () => {
    if (!menuTrack) return;
    void backupTrack
      .mutateAsync({ trackId: menuTrack.id })
      .catch((error) => {
        closeTrackMenu();
        showError(
          'Backup failed',
          getErrorMessage(error, 'Check your connection and try again.'),
        );
      });
  };

  const publishFromMenu = () => {
    if (!menuTrack) return;
    const item = menuTrack;
    closeTrackMenu();
    setPublishTrack(item);
  };

  const unpublishFromMenu = () => {
    if (!menuTrack) return;
    const item = menuTrack;
    closeTrackMenu();
    confirm(
      'Unpublish track?',
      'It will return to draft and leave the public feed.',
      {
        confirmLabel: 'Unpublish',
        pendingLabel: 'Unpublishing…',
        destructive: true,
        onConfirm: async () => {
          try {
            await unpublishTrack.mutateAsync(item.id);
          } catch (error) {
            showError(
              'Could not unpublish',
              getErrorMessage(error, 'Try again.'),
            );
            throw error;
          }
        },
      },
    );
  };

  const deleteFromMenu = () => {
    if (!menuTrack) return;
    const item = menuTrack;
    closeTrackMenu();
    confirm(
      'Delete track?',
      'This permanently deletes the track from your library and projects.',
      {
        confirmLabel: 'Delete',
        pendingLabel: 'Deleting…',
        destructive: true,
        onConfirm: async () => {
          try {
            await deleteTrack.mutateAsync(item.id);
          } catch (error) {
            showError('Could not delete', getErrorMessage(error, 'Try again.'));
          }
        },
      },
    );
  };

  const canRestoreFromCloud = (item: LibraryAudioItem) =>
    Boolean(item.mixUrl) ||
    item.storageState === 'SYNCED' ||
    item.storageState === 'CLOUD_ONLY';

  const openEditorForItem = async (item: LibraryAudioItem): Promise<boolean> => {
    let storageState = item.storageState;

    if (!hasLocalProject(item.id)) {
      if (!canRestoreFromCloud(item)) {
        showError(item.title, 'This take is not available on this device.');
        return false;
      }
      await restoreTrack(item.id);
      storageState = 'SYNCED';
    }

    const loaded = await loadProjectBundle(item.id);
    if (!loaded) {
      showError(item.title, 'Could not load this take locally.');
      return false;
    }

    if (item.kind === 'MULTI') {
      useMultitrackEntryStore.getState().setPendingEntry({
        project: loaded.project,
        trackId: item.id,
        title: loaded.title || item.title,
        storageState,
      });
      push('/studio/multitrack' as Href);
      return true;
    }

    // Prefer on-disk title so renames survive reopen even if list cache lags.
    hydrateFromImport(loaded.project, loaded.title || item.title, item.id);
    push({
      pathname: '/studio/quick-record/edit',
      params: { storageState, discardTarget: 'library' },
    } as never);
    return true;
  };

  const openAudioItem = (item: LibraryAudioItem) => {
    if (item.unavailable) {
      removeUnavailable(item);
      return;
    }

    const needsRestore = !hasLocalProject(item.id);

    if (item.status === 'PUBLISHED') {
      confirm(
        'Unpublish to edit?',
        needsRestore
          ? 'Published tracks are frozen. Unpublish, then download from the cloud to edit.'
          : 'Published tracks are frozen. Unpublish first to open the editor.',
        {
          confirmLabel: 'Unpublish',
          pendingLabel: needsRestore ? 'Opening…' : 'Unpublishing…',
          onConfirm: async () => {
            try {
              await unpublishTrack.mutateAsync(item.id);
            } catch (error) {
              showError(
                'Could not unpublish',
                getErrorMessage(error, 'Try again.'),
              );
              throw error;
            }
            try {
              const opened = await openEditorForItem(item);
              if (!opened) {
                throw new Error('Could not open editor');
              }
            } catch (error) {
              if (
                error instanceof Error &&
                error.message === 'Could not open editor'
              ) {
                throw error;
              }
              showError(
                'Could not download',
                getErrorMessage(error, 'Try again.'),
              );
              throw error;
            }
          },
        },
      );
      return;
    }

    if (needsRestore) {
      if (!canRestoreFromCloud(item)) {
        showError(item.title, 'This take is not available on this device.');
        return;
      }

      confirm(
        'Download to edit?',
        'This take is not on this device. Download it from the cloud to open the editor.',
        {
          confirmLabel: 'Download',
          pendingLabel: 'Downloading…',
          onConfirm: async () => {
            try {
              const opened = await openEditorForItem(item);
              if (!opened) {
                throw new Error('Could not open editor');
              }
            } catch (error) {
              if (
                error instanceof Error &&
                error.message === 'Could not open editor'
              ) {
                throw error;
              }
              showError(
                'Could not download',
                getErrorMessage(error, 'Try again.'),
              );
              throw error;
            }
          },
        },
      );
      return;
    }

    void openEditorForItem(item);
  };

  const onMorePress = (item: LibraryAudioItem) => {
    if (item.unavailable) {
      removeUnavailable(item);
      return;
    }

    setMenuTrackId(item.id);
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title="Library"
        onBack={() =>
          replace(
            (openedFrom === 'home'
              ? '/(tabs)'
              : '/(tabs)/profile') as Href,
          )
        }
      />

      <LibrarySegmentTabs activeTab={activeTab} onChange={setActiveTab} />

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

      <TrackActionsDialog
        open={menuTrack != null}
        onOpenChange={(open) => {
          if (!open) closeTrackMenu();
        }}
        title={menuTrack?.title ?? ''}
        synced={menuTrack?.storageState === 'SYNCED'}
        published={menuTrack?.status === 'PUBLISHED'}
        canBackup={Boolean(menuTrack?.localUri)}
        hasFeedClip={Boolean(menuTrack?.feedClipId)}
        isBackingUp={backupTrack.isPending}
        isUnpublishing={unpublishTrack.isPending}
        isRemovingFeedClip={deleteFeedClip.isPending}
        onBackup={backupFromMenu}
        onPublish={publishFromMenu}
        onUnpublish={unpublishFromMenu}
        onCreateFeedClip={() => {
          if (!menuTrack) return;
          const id = menuTrack.id;
          closeTrackMenu();
          push(`/studio/create-feed-clip?trackId=${encodeURIComponent(id)}`);
        }}
        onEditFeedClip={() => {
          if (!menuTrack) return;
          const id = menuTrack.id;
          closeTrackMenu();
          push(`/studio/create-feed-clip?trackId=${encodeURIComponent(id)}`);
        }}
        onRemoveFeedClip={() => {
          if (!menuTrack?.feedClipId) return;
          const clipId = menuTrack.feedClipId;
          closeTrackMenu();
          void deleteFeedClip
            .mutateAsync(clipId)
            .then(() => {
              showError('Removed from Feed', 'The full song is unchanged.');
            })
            .catch((error) => {
              showError(
                'Could not remove clip',
                getErrorMessage(error, 'Try again.'),
              );
            });
        }}
        onDelete={deleteFromMenu}
      />

      {/* Playlist Actions Sheet */}
      <ActionsDialog
        open={menuPlaylist != null}
        onOpenChange={(open) => {
          if (!open) setMenuPlaylist(null);
        }}
        variant="menu"
        title={menuPlaylist?.title ?? ''}
        actions={[
          {
            key: 'open',
            label: 'Open playlist',
            icon: FolderOpen,
            onPress: () => {
              if (!menuPlaylist) return;
              const item = menuPlaylist;
              setMenuPlaylist(null);
              openPlaylist(item);
            },
          },
        ]}
        destructiveAction={{
          label: 'Delete playlist',
          icon: Trash2,
          onPress: () => {
            if (!menuPlaylist) return;
            const item = menuPlaylist;
            setMenuPlaylist(null);
            confirm(
              'Delete playlist?',
              'Tracks stay in your library. Only the playlist is removed.',
              {
                confirmLabel: 'Delete',
                destructive: true,
                onConfirm: async () => {
                  try {
                    await deletePlaylist.mutateAsync(item.id);
                  } catch (error) {
                    showError(
                      'Could not delete',
                      getErrorMessage(error, 'Try again.'),
                    );
                  }
                },
              },
            );
          },
        }}
      />

      {/* Album Actions Sheet */}
      <ActionsDialog
        open={menuAlbum != null}
        onOpenChange={(open) => {
          if (!open) setMenuAlbum(null);
        }}
        variant="menu"
        title={menuAlbum?.title ?? ''}
        actions={[
          {
            key: 'open',
            label: 'Open album',
            icon: FolderOpen,
            onPress: () => {
              if (!menuAlbum) return;
              const item = menuAlbum;
              setMenuAlbum(null);
              openAlbum(item);
            },
          },
        ]}
        destructiveAction={{
          label: 'Delete album',
          icon: Trash2,
          onPress: () => {
            if (!menuAlbum) return;
            const item = menuAlbum;
            setMenuAlbum(null);
            confirm(
              'Delete album?',
              'Tracks stay published as singles. Only the album is removed.',
              {
                confirmLabel: 'Delete',
                destructive: true,
                onConfirm: async () => {
                  try {
                    await deleteAlbum.mutateAsync(item.id);
                  } catch (error) {
                    showError(
                      'Could not delete',
                      getErrorMessage(error, 'Try again.'),
                    );
                  }
                },
              },
            );
          },
        }}
      />

      {/* Project Actions Sheet */}
      <ActionsDialog
        open={menuProject != null}
        onOpenChange={(open) => {
          if (!open) setMenuProject(null);
        }}
        variant="menu"
        title={menuProject?.title ?? ''}
        actions={[
          {
            key: 'rename',
            label: 'Rename project',
            icon: Pencil,
            onPress: () => {
              if (!menuProject) return;
              const project = menuProject;
              setMenuProject(null);
              setRenameTitle(project.title);
              setRenameTarget(project);
            },
          },
        ]}
        destructiveAction={{
          label: 'Delete project',
          icon: Trash2,
          onPress: () => {
            if (!menuProject) return;
            const project = menuProject;
            setMenuProject(null);
            setDeleteProjectTarget(project);
          },
        }}
      />

      {/* Delete Project Confirm Dialog */}
      <ActionsDialog
        open={deleteProjectTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteProjectTarget(null);
        }}
        variant="confirm"
        title="Delete project?"
        message="Keep the tracks in your library, or delete the tracks too."
        busy={deleteProject.isPending}
        actions={[
          {
            key: 'keep',
            label: deleteProject.isPending ? 'Deleting…' : 'Keep tracks',
            onPress: () => {
              if (!deleteProjectTarget) return;
              runDeleteProject(deleteProjectTarget, false);
            },
          },
          {
            key: 'delete-tracks',
            label: 'Delete tracks too',
            variant: 'destructive',
            onPress: () => {
              if (!deleteProjectTarget) return;
              runDeleteProject(deleteProjectTarget, true);
            },
          },
        ]}
      />

      {/* Saved Collection Actions Sheet */}
      <ActionsDialog
        open={menuSavedCollection != null}
        onOpenChange={(open) => {
          if (!open) setMenuSavedCollection(null);
        }}
        variant="menu"
        title={menuSavedCollection?.title ?? ''}
        destructiveAction={{
          label: 'Remove from saved',
          icon: Trash2,
          onPress: () => {
            if (!menuSavedCollection) return;
            const item = menuSavedCollection;
            const unsave = item.kind === 'playlist' ? unsavePlaylist : unsaveAlbum;
            setMenuSavedCollection(null);
            void unsave.mutateAsync(item.id).catch((error) => {
              showError('Could not remove', getErrorMessage(error, 'Try again.'));
            });
          },
        }}
      />

      <PublishTrackSheet
        open={publishTrack != null}
        onOpenChange={(open) => {
          if (!open) setPublishTrack(null);
        }}
        track={publishTrack}
        bottomOffset={Math.max(insets.bottom, 12)}
        onPublished={() => {
          const id = publishTrack?.id;
          showError(
            'Published',
            id
              ? 'Your track is live. Opening Feed Clip editor…'
              : 'Your track is live.',
          );
          if (id) {
            push(
              `/studio/create-feed-clip?trackId=${encodeURIComponent(id)}`,
            );
          }
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

      <Dialog
        open={renameTarget != null}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}>
        <DialogContent dismissOnBackdropPress={!updateProject.isPending}>
          <DialogHeader>
            <DialogTitle>Rename project</DialogTitle>
          </DialogHeader>
          <Input
            value={renameTitle}
            onChangeText={setRenameTitle}
            placeholder="Project title"
            autoFocus
            maxLength={100}
            editable={!updateProject.isPending}
            returnKeyType="done"
            onSubmitEditing={submitRename}
          />
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              disabled={updateProject.isPending}
              onPress={() => setRenameTarget(null)}>
              <Text>Cancel</Text>
            </Button>
            <Button
              variant="soft"
              size="sm"
              disabled={updateProject.isPending}
              onPress={submitRename}>
              <Text>{updateProject.isPending ? 'Saving…' : 'Save'}</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {dialog}
    </View>
  );
}
