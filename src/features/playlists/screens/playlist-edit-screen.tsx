import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { getErrorMessage, isApiError } from '@/core/api';
import {
  CollectionEditForm,
  type CollectionEditFormValues,
} from '@/features/library/components/collection-edit-form';
import { pickProfileImage } from '@/features/profile/utils/pick-profile-image';
import { ScreenHeader } from '@/shared/components/layout/screen-header';
import { useFeedbackDialog } from '@/shared/components/ui/feedback-dialog';
import { Text } from '@/shared/components/ui/text';

import {
  useDeletePlaylistCover,
  usePlaylist,
  useUpdatePlaylist,
  useUploadPlaylistCover,
} from '../api/hooks';

export function PlaylistEditScreen() {
  const { back, canGoBack, replace } = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const playlistId = typeof id === 'string' ? id : undefined;
  const { showError, dialog } = useFeedbackDialog();

  const playlistQuery = usePlaylist(playlistId);
  const updatePlaylist = useUpdatePlaylist();
  const uploadCover = useUploadPlaylistCover();
  const deleteCover = useDeletePlaylistCover();

  const playlist = playlistQuery.data ?? null;

  const leave = () => {
    if (canGoBack()) {
      back();
      return;
    }
    if (playlistId) {
      replace(`/playlists/${playlistId}` as Href);
      return;
    }
    replace('/(tabs)/library' as Href);
  };

  const onSave = (values: CollectionEditFormValues) => {
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
      .then(leave)
      .catch((error) => {
        showError(
          'Could not save',
          isApiError(error) ? error.message : getErrorMessage(error),
        );
      });
  };

  const onPickCover = async () => {
    if (!playlistId) return;
    const picked = await pickProfileImage({ source: 'library', kind: 'avatar' });
    if (!picked.ok) {
      if (!picked.canceled) {
        showError(picked.title, picked.message);
      }
      return;
    }
    try {
      await uploadCover.mutateAsync({
        playlistId,
        localUri: picked.uri,
        contentType:
          picked.contentType === 'image/jpg' ? 'image/jpeg' : picked.contentType,
      });
    } catch (error) {
      showError(
        'Upload failed',
        isApiError(error) ? error.message : getErrorMessage(error),
      );
    }
  };

  const onRemoveCover = () => {
    if (!playlistId || !playlist?.coverUrl) return;
    void deleteCover.mutateAsync(playlistId).catch((error) => {
      showError(
        'Remove failed',
        isApiError(error) ? error.message : getErrorMessage(error),
      );
    });
  };

  if (playlistQuery.isLoading && !playlist) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#D0BCFF" />
      </View>
    );
  }

  if (playlistQuery.isError || !playlist || !playlistId) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Edit playlist" onBack={leave} />
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
        {dialog}
      </View>
    );
  }

  if (!playlist.isOwner) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Edit playlist" onBack={leave} />
        <View className="flex-1 items-center justify-center px-8">
          <Text variant="body-md" className="text-center text-on-surface-variant">
            Only the owner can edit this playlist.
          </Text>
        </View>
        {dialog}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Edit playlist" onBack={leave} />
      <CollectionEditForm
        kind="playlist"
        coverRecyclingKey={playlist.id}
        coverUrl={playlist.coverUrl}
        coverFallbackUrls={playlist.coverFallbackUrls}
        isSaving={updatePlaylist.isPending}
        isCoverBusy={uploadCover.isPending || deleteCover.isPending}
        initial={{
          title: playlist.title,
          description: playlist.description ?? '',
          visibility: playlist.visibility === 'PUBLIC' ? 'public' : 'private',
        }}
        onSave={onSave}
        onPickCover={() => {
          void onPickCover();
        }}
        onRemoveCover={onRemoveCover}
      />
      {dialog}
    </View>
  );
}

export default PlaylistEditScreen;
