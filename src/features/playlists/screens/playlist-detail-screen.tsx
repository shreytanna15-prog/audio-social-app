import { MoreVertical } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/core/api/errors';
import { usePlayerStore } from '@/features/player';
import {
  useSavePlaylist,
  useUnsavePlaylist,
} from '@/features/saves';
import { ScreenHeader } from '@/shared/components/layout/screen-header';
import { useFeedbackDialog } from '@/shared/components/ui/feedback-dialog';
import { Text } from '@/shared/components/ui/text';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

import { CollectionAttachTracksSheet } from '@/features/library/components/collection-attach-tracks-sheet';
import {
  CollectionEditDialog,
  type CollectionEditValues,
} from '@/features/library/components/collection-edit-dialog';
import { CollectionOverviewCard } from '@/features/library/components/collection-overview-card';
import { CollectionSaveButton } from '@/features/library/components/collection-save-button';
import {
  CollectionTrackRow,
  type CollectionTrackRowItem,
} from '@/features/library/components/collection-track-row';
import {
  mapCollectionTrackToPlayerTrack,
  mapCollectionTrackToRow,
} from '@/features/library/utils/map-collection-track';

import {
  useAttachPlaylistTracks,
  useDeletePlaylist,
  usePlaylist,
  useUnlinkPlaylistTrack,
  useUpdatePlaylist,
} from '../api/hooks';

export function PlaylistDetailScreen() {
  const insets = useSafeAreaInsets();
  const { back, canGoBack, replace, push } = useRouter();
  const { guard } = useNavigationGuard();
  const { id, title: titleParam } = useLocalSearchParams<{
    id?: string;
    title?: string;
  }>();
  const playlistId = typeof id === 'string' ? id : undefined;
  const { show, showError, confirm, dialog } = useFeedbackDialog();

  const playlistQuery = usePlaylist(playlistId);
  const updatePlaylist = useUpdatePlaylist();
  const deletePlaylist = useDeletePlaylist();
  const attachTracks = useAttachPlaylistTracks();
  const unlinkTrack = useUnlinkPlaylistTrack();
  const savePlaylist = useSavePlaylist();
  const unsavePlaylist = useUnsavePlaylist();
  const play = usePlayerStore((s) => s.play);

  const [attachOpen, setAttachOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const playlist = playlistQuery.data ?? null;
  const coverUrl = playlist
    ? (playlist.coverUrl ?? playlist.coverFallbackUrls[0] ?? null)
    : null;
  const headerTitle =
    (typeof titleParam === 'string' && titleParam.trim()) ||
    playlist?.title ||
    'Playlist';

  const rows = useMemo(
    () => (playlist?.tracks ?? []).map(mapCollectionTrackToRow),
    [playlist?.tracks],
  );

  const leave = () => {
    if (canGoBack()) {
      guard(() => back());
      return;
    }
    guard(() => replace('/(tabs)/library' as Href));
  };

  const playRow = (row: CollectionTrackRowItem) => {
    const track = playlist?.tracks.find((t) => t.id === row.id);
    if (!track?.available) return;
    play(mapCollectionTrackToPlayerTrack(track, coverUrl));
    guard(() => push('/player'));
  };

  const toggleSaved = () => {
    if (!playlistId || !playlist) return;
    const mutation = playlist.isSaved ? unsavePlaylist : savePlaylist;
    void mutation.mutateAsync(playlistId).catch((error) => {
      showError('Could not update saved', getErrorMessage(error, 'Try again.'));
    });
  };

  const submitEdit = (values: CollectionEditValues) => {
    if (!playlistId) return;
    if (!values.title) {
      showError('Title required', 'Give it a name.');
      return;
    }
    void updatePlaylist
      .mutateAsync({
        id: playlistId,
        body: {
          title: values.title,
          description: values.description || null,
          visibility: values.visibility === 'public' ? 'PUBLIC' : 'PRIVATE',
        },
      })
      .then(() => setEditOpen(false))
      .catch((error) => {
        showError('Could not save', getErrorMessage(error, 'Try again.'));
      });
  };

  const openMenu = () => {
    if (!playlistId) return;
    show({
      title: headerTitle,
      actions: [
        {
          label: 'Add published tracks',
          variant: 'soft',
          onPress: () => setAttachOpen(true),
        },
        {
          label: 'Edit details',
          variant: 'soft',
          onPress: () => setEditOpen(true),
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
                  void deletePlaylist
                    .mutateAsync(playlistId)
                    .then(leave)
                    .catch((error) => {
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

  const onTrackMore = (row: CollectionTrackRowItem) => {
    if (!playlistId) return;
    show({
      title: row.title,
      actions: [
        {
          label: 'Remove from playlist',
          variant: 'destructive',
          onPress: () => {
            confirm('Remove from playlist?', 'The track itself is not deleted.', {
              confirmLabel: 'Remove',
              destructive: true,
              onConfirm: () => {
                void unlinkTrack
                  .mutateAsync({ playlistId, trackId: row.id })
                  .catch((error) => {
                    showError(
                      'Could not remove',
                      getErrorMessage(error, 'Try again.'),
                    );
                  });
              },
            });
          },
        },
        { label: 'Cancel', variant: 'ghost' },
      ],
    });
  };

  const isOwner = playlist?.isOwner ?? false;
  const isSavePending = savePlaylist.isPending || unsavePlaylist.isPending;
  const visibilityLabel = playlist?.visibility === 'PUBLIC' ? 'Public' : 'Private';

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title={headerTitle}
        onBack={leave}
        right={
          isOwner ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="More options"
              hitSlop={8}
              onPress={openMenu}
              className="h-10 w-10 items-center justify-center rounded-full active:bg-surface-bright">
              <MoreVertical size={20} color="#E4E1EA" strokeWidth={2} />
            </Pressable>
          ) : undefined
        }
      />

      {playlistQuery.isLoading && !playlist ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D0BCFF" />
        </View>
      ) : playlistQuery.isError || !playlist || !playlistId ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Text variant="title-md" className="text-on-surface">
            Couldn’t load playlist
          </Text>
          <Text variant="body-md" className="text-center text-on-surface-variant">
            {getErrorMessage(playlistQuery.error, 'Try again in a moment.')}
          </Text>
          <Pressable
            onPress={() => {
              void playlistQuery.refetch();
            }}
            className="rounded-full bg-surface-container px-4 py-2">
            <Text variant="label-md" className="text-on-surface">
              Retry
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-8 px-5 pt-6"
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 24 }}
          showsVerticalScrollIndicator={false}>
          <CollectionOverviewCard
            id={playlist.id}
            title={playlist.title}
            description={playlist.description}
            coverUrl={coverUrl}
            meta={`${playlist.trackCount} ${playlist.trackCount === 1 ? 'track' : 'tracks'}${
              playlist.saveCount > 0 ? ` · ${playlist.saveCount} saves` : ''
            }`}
            badges={[visibilityLabel]}
            action={
              isOwner ? null : (
                <CollectionSaveButton
                  isSaved={playlist.isSaved}
                  isPending={isSavePending}
                  onPress={toggleSaved}
                />
              )
            }
          />

          <View className="gap-4">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="font-sans text-[12px] font-semibold uppercase leading-4 tracking-[0.08em] text-on-surface-variant">
                Tracks
              </Text>
              <Text className="font-sans text-[12px] font-medium leading-4 text-on-surface-variant">
                {rows.length} {rows.length === 1 ? 'item' : 'items'}
              </Text>
            </View>

            {rows.length === 0 ? (
              <View className="gap-2 rounded-2xl bg-surface-container px-4 py-6">
                <Text variant="title-md" className="text-on-surface">
                  No tracks yet
                </Text>
                <Text variant="body-md" className="text-on-surface-variant">
                  {isOwner
                    ? 'Add published tracks from the menu.'
                    : 'This playlist has no tracks.'}
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                {rows.map((row) => (
                  <CollectionTrackRow
                    key={row.id}
                    item={row}
                    onPress={playRow}
                    onMorePress={isOwner ? onTrackMore : undefined}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {isOwner ? (
        <>
          <CollectionAttachTracksSheet
            open={attachOpen}
            onOpenChange={setAttachOpen}
            kind="playlist"
            attachedTrackIds={new Set(playlist?.tracks.map((t) => t.id) ?? [])}
            bottomOffset={Math.max(insets.bottom, 12)}
            isSubmitting={attachTracks.isPending}
            onAttach={(trackIds) => {
              if (!playlistId) return;
              void attachTracks
                .mutateAsync({ id: playlistId, body: { trackIds } })
                .then(() => setAttachOpen(false))
                .catch((error) => {
                  showError(
                    'Could not add tracks',
                    getErrorMessage(error, 'Try again.'),
                  );
                });
            }}
          />

          {playlist ? (
            <CollectionEditDialog
              key={`${playlist.id}-${playlist.updatedAt}-${editOpen}`}
              kind="playlist"
              open={editOpen}
              onOpenChange={setEditOpen}
              isPending={updatePlaylist.isPending}
              initial={{
                title: playlist.title,
                description: playlist.description ?? '',
                visibility: playlist.visibility === 'PUBLIC' ? 'public' : 'private',
              }}
              onSubmit={submitEdit}
            />
          ) : null}
        </>
      ) : null}

      {dialog}
    </View>
  );
}

export default PlaylistDetailScreen;
