import { MoreVertical } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/core/api/errors';
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
import { usePlayerStore } from '@/features/player';
import { useSaveAlbum, useUnsaveAlbum } from '@/features/saves';
import { ScreenHeader } from '@/shared/components/layout/screen-header';
import { useFeedbackDialog } from '@/shared/components/ui/feedback-dialog';
import { Text } from '@/shared/components/ui/text';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

import {
  useAlbum,
  useAttachAlbumTracks,
  useDeleteAlbum,
  useReleaseAlbum,
  useUnlinkAlbumTrack,
  useUnreleaseAlbum,
  useUpdateAlbum,
} from '../api/hooks';

export function AlbumDetailScreen() {
  const insets = useSafeAreaInsets();
  const { back, canGoBack, replace, push } = useRouter();
  const { guard } = useNavigationGuard();
  const { id, title: titleParam, from } = useLocalSearchParams<{
    id?: string;
    title?: string;
    from?: string | string[];
  }>();
  const albumId = typeof id === 'string' ? id : undefined;
  const openedFrom = Array.isArray(from) ? from[0] : from;
  const { show, showError, confirm, dialog } = useFeedbackDialog();

  const albumQuery = useAlbum(albumId);
  const updateAlbum = useUpdateAlbum();
  const deleteAlbum = useDeleteAlbum();
  const releaseAlbum = useReleaseAlbum();
  const unreleaseAlbum = useUnreleaseAlbum();
  const attachTracks = useAttachAlbumTracks();
  const unlinkTrack = useUnlinkAlbumTrack();
  const saveAlbum = useSaveAlbum();
  const unsaveAlbum = useUnsaveAlbum();
  const play = usePlayerStore((s) => s.play);

  const [attachOpen, setAttachOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const album = albumQuery.data ?? null;
  const coverUrl = album ? (album.coverUrl ?? album.coverFallbackUrl) : null;
  const headerTitle =
    (typeof titleParam === 'string' && titleParam.trim()) ||
    album?.title ||
    'Album';

  const rows = useMemo(
    () => (album?.tracks ?? []).map(mapCollectionTrackToRow),
    [album?.tracks],
  );

  const leave = () => {
    if (openedFrom === 'home') {
      guard(() => replace('/(tabs)' as Href));
      return;
    }
    if (canGoBack()) {
      guard(() => back());
      return;
    }
    guard(() => replace('/(tabs)/library' as Href));
  };

  const playRow = (row: CollectionTrackRowItem) => {
    const track = album?.tracks.find((t) => t.id === row.id);
    if (!track?.available) return;
    play(mapCollectionTrackToPlayerTrack(track, coverUrl));
    guard(() => push('/player'));
  };

  const toggleSaved = () => {
    if (!albumId || !album) return;
    const mutation = album.isSaved ? unsaveAlbum : saveAlbum;
    void mutation.mutateAsync(albumId).catch((error) => {
      showError('Could not update saved', getErrorMessage(error, 'Try again.'));
    });
  };

  const submitEdit = (values: CollectionEditValues) => {
    if (!albumId) return;
    if (!values.title) {
      showError('Title required', 'Give it a name.');
      return;
    }
    void updateAlbum
      .mutateAsync({
        id: albumId,
        body: {
          title: values.title,
          description: values.description || null,
        },
      })
      .then(() => setEditOpen(false))
      .catch((error) => {
        showError('Could not save', getErrorMessage(error, 'Try again.'));
      });
  };

  const toggleRelease = () => {
    if (!albumId || !album) return;
    const isReleased = album.status === 'RELEASED';
    const mutation = isReleased ? unreleaseAlbum : releaseAlbum;
    void mutation.mutateAsync(albumId).catch((error) => {
      showError(
        isReleased ? 'Could not unrelease' : 'Could not release',
        getErrorMessage(error, 'Try again.'),
      );
    });
  };

  const openMenu = () => {
    if (!albumId || !album) return;
    const isReleased = album.status === 'RELEASED';
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
          label: isReleased ? 'Unrelease album' : 'Release album',
          variant: 'soft',
          onPress: toggleRelease,
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
                  void deleteAlbum
                    .mutateAsync(albumId)
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
    if (!albumId) return;
    show({
      title: row.title,
      actions: [
        {
          label: 'Remove from album',
          variant: 'destructive',
          onPress: () => {
            confirm('Remove from album?', 'The track stays published as a single.', {
              confirmLabel: 'Remove',
              destructive: true,
              onConfirm: () => {
                void unlinkTrack
                  .mutateAsync({ albumId, trackId: row.id })
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

  const isOwner = album?.isOwner ?? false;
  const isSavePending = saveAlbum.isPending || unsaveAlbum.isPending;
  const statusLabel = album?.status === 'RELEASED' ? 'Released' : 'Draft';

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

      {albumQuery.isLoading && !album ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D0BCFF" />
        </View>
      ) : albumQuery.isError || !album || !albumId ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Text variant="title-md" className="text-on-surface">
            Couldn’t load album
          </Text>
          <Text variant="body-md" className="text-center text-on-surface-variant">
            {getErrorMessage(albumQuery.error, 'Try again in a moment.')}
          </Text>
          <Pressable
            onPress={() => {
              void albumQuery.refetch();
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
            id={album.id}
            title={album.title}
            description={album.description}
            coverUrl={coverUrl}
            meta={`${album.trackCount} ${album.trackCount === 1 ? 'track' : 'tracks'}`}
            badges={[statusLabel]}
            action={
              isOwner ? null : (
                <CollectionSaveButton
                  isSaved={album.isSaved}
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
                    ? 'Add your published tracks from the menu.'
                    : 'This album has no tracks.'}
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
            kind="album"
            attachedTrackIds={new Set(album?.tracks.map((t) => t.id) ?? [])}
            bottomOffset={Math.max(insets.bottom, 12)}
            isSubmitting={attachTracks.isPending}
            onAttach={(trackIds) => {
              if (!albumId) return;
              void attachTracks
                .mutateAsync({ id: albumId, body: { trackIds } })
                .then(() => setAttachOpen(false))
                .catch((error) => {
                  showError(
                    'Could not add tracks',
                    getErrorMessage(error, 'Try again.'),
                  );
                });
            }}
          />

          {album ? (
            <CollectionEditDialog
              key={`${album.id}-${album.updatedAt}-${editOpen}`}
              kind="album"
              open={editOpen}
              onOpenChange={setEditOpen}
              isPending={updateAlbum.isPending}
              initial={{
                title: album.title,
                description: album.description ?? '',
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

export default AlbumDetailScreen;
