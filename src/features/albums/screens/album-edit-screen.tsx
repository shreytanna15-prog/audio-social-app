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
  useAlbum,
  useDeleteAlbumCover,
  useUpdateAlbum,
  useUploadAlbumCover,
} from '../api/hooks';

export function AlbumEditScreen() {
  const { back, canGoBack, replace } = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const albumId = typeof id === 'string' ? id : undefined;
  const { showError, dialog } = useFeedbackDialog();

  const albumQuery = useAlbum(albumId);
  const updateAlbum = useUpdateAlbum();
  const uploadCover = useUploadAlbumCover();
  const deleteCover = useDeleteAlbumCover();

  const album = albumQuery.data ?? null;
  const coverUrl = album ? (album.coverUrl ?? album.coverFallbackUrl) : null;
  const hasCustomCover = Boolean(album?.coverUrl);

  const leave = () => {
    if (canGoBack()) {
      back();
      return;
    }
    if (albumId) {
      replace(`/albums/${albumId}` as Href);
      return;
    }
    replace('/(tabs)/library' as Href);
  };

  const onSave = (values: CollectionEditFormValues) => {
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
      .then(leave)
      .catch((error) => {
        showError(
          'Could not save',
          isApiError(error) ? error.message : getErrorMessage(error),
        );
      });
  };

  const onPickCover = async () => {
    if (!albumId) return;
    const picked = await pickProfileImage({ source: 'library', kind: 'avatar' });
    if (!picked.ok) {
      if (!picked.canceled) {
        showError(picked.title, picked.message);
      }
      return;
    }
    try {
      await uploadCover.mutateAsync({
        albumId,
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
    if (!albumId || !hasCustomCover) return;
    void deleteCover.mutateAsync(albumId).catch((error) => {
      showError(
        'Remove failed',
        isApiError(error) ? error.message : getErrorMessage(error),
      );
    });
  };

  if (albumQuery.isLoading && !album) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#D0BCFF" />
      </View>
    );
  }

  if (albumQuery.isError || !album || !albumId) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Edit album" onBack={leave} />
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
        {dialog}
      </View>
    );
  }

  if (!album.isOwner) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Edit album" onBack={leave} />
        <View className="flex-1 items-center justify-center px-8">
          <Text variant="body-md" className="text-center text-on-surface-variant">
            Only the owner can edit this album.
          </Text>
        </View>
        {dialog}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Edit album" onBack={leave} />
      <CollectionEditForm
        kind="album"
        coverRecyclingKey={album.id}
        coverUrl={coverUrl}
        coverFallbackUrls={
          album.coverFallbackUrl && !album.coverUrl
            ? [album.coverFallbackUrl]
            : []
        }
        isSaving={updateAlbum.isPending}
        isCoverBusy={uploadCover.isPending || deleteCover.isPending}
        initial={{
          title: album.title,
          description: album.description ?? '',
        }}
        onSave={onSave}
        onPickCover={() => {
          void onPickCover();
        }}
        onRemoveCover={hasCustomCover ? onRemoveCover : undefined}
      />
      {dialog}
    </View>
  );
}

export default AlbumEditScreen;
