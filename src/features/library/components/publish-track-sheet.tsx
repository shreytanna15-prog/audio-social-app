import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { getErrorMessage } from '@/core/api/errors';
import {
  MAX_TRACK_GENRES,
  MAX_TRACK_KEYWORDS,
  TRACK_GENRE_LABELS,
  TRACK_GENRES,
  type TrackGenreId,
} from '@/features/tracks/constants/track-genres';
import {
  usePublishTrack,
  useUploadTrackCover,
} from '@/features/tracks';
import type { CoverContentType } from '@/features/tracks/types';
import { pickProfileImage } from '@/features/profile/utils/pick-profile-image';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet';
import { Text } from '@/shared/components/ui/text';

import type { LibraryAudioItem } from '../types';

type PublishTrackSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: LibraryAudioItem | null;
  bottomOffset?: number;
  onPublished?: () => void;
  onError?: (title: string, message: string) => void;
};

export function PublishTrackSheet({
  open,
  onOpenChange,
  track,
  bottomOffset = 12,
  onPublished,
  onError,
}: PublishTrackSheetProps) {
  const uploadCover = useUploadTrackCover();
  const publishTrack = usePublishTrack();

  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [coverType, setCoverType] = useState<CoverContentType | null>(null);
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');
  const [keywordsText, setKeywordsText] = useState('');
  const [genres, setGenres] = useState<TrackGenreId[]>([]);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setCoverUri(null);
    setCoverType(null);
    setCaption('');
    setDescription('');
    setKeywordsText('');
    setGenres([]);
    setBusy(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      reset();
    }
    onOpenChange(next);
  };

  const toggleGenre = (id: TrackGenreId) => {
    setGenres((prev) => {
      if (prev.includes(id)) {
        return prev.filter((g) => g !== id);
      }
      if (prev.length >= MAX_TRACK_GENRES) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const pickCover = async () => {
    const picked = await pickProfileImage({
      source: 'library',
      kind: 'cover',
    });
    if (!picked.ok) {
      if (!picked.canceled) {
        onError?.(picked.title, picked.message);
      }
      return;
    }
    setCoverUri(picked.uri);
    setCoverType(
      picked.contentType === 'image/jpg' ? 'image/jpeg' : picked.contentType,
    );
  };

  const submit = async () => {
    if (!track || busy) return;

    if (!coverUri || !coverType) {
      onError?.('Cover required', 'Add a cover image before publishing.');
      return;
    }
    if (genres.length < 1) {
      onError?.('Genres required', 'Pick between 1 and 3 genres.');
      return;
    }

    const keywords = [
      ...new Set(
        keywordsText
          .split(/[,\s]+/)
          .map((k) => k.trim().toLowerCase())
          .filter(Boolean),
      ),
    ].slice(0, MAX_TRACK_KEYWORDS);

    setBusy(true);
    try {
      await uploadCover.mutateAsync({
        trackId: track.id,
        localUri: coverUri,
        contentType: coverType,
      });
      await publishTrack.mutateAsync({
        trackId: track.id,
        body: {
          caption: caption.trim() || null,
          description: description.trim() || null,
          genres,
          keywords,
        },
      });
      handleOpenChange(false);
      onPublished?.();
    } catch (error) {
      onError?.(
        'Publish failed',
        getErrorMessage(error, 'Check your connection and try again.'),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open && !!track} onOpenChange={handleOpenChange}>
      <SheetContent bottomOffset={bottomOffset} className="bg-[#17171D]">
        <SheetClose />
        <SheetHeader>
          <SheetTitle>Publish</SheetTitle>
          <SheetDescription>
            {track?.title ?? 'Track'} — cover, genres, and details.
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          <ScrollView
            className="max-h-[70vh]"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <View className="gap-4 pb-4">
              <Pressable
                onPress={() => {
                  void pickCover();
                }}
                accessibilityRole="button"
                accessibilityLabel="Choose cover image"
                className="overflow-hidden rounded-2xl bg-surface-container">
                {coverUri ? (
                  <Image
                    source={{ uri: coverUri }}
                    style={{ width: '100%', height: 160 }}
                    contentFit="cover"
                  />
                ) : (
                  <View className="h-40 items-center justify-center px-4">
                    <Text variant="title-md" className="text-on-surface">
                      Add cover image
                    </Text>
                    <Text
                      variant="body-md"
                      className="mt-1 text-center text-on-surface-variant">
                      JPEG, PNG, or WebP
                    </Text>
                  </View>
                )}
              </Pressable>

              <View className="gap-2">
                <Text variant="label-md" className="text-on-surface-variant">
                  Caption
                </Text>
                <Input
                  value={caption}
                  onChangeText={setCaption}
                  placeholder="Optional caption"
                  maxLength={200}
                  editable={!busy}
                />
              </View>

              <View className="gap-2">
                <Text variant="label-md" className="text-on-surface-variant">
                  Description
                </Text>
                <Input
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Optional description"
                  maxLength={1000}
                  multiline
                  editable={!busy}
                  className="min-h-24"
                />
              </View>

              <View className="gap-2">
                <Text variant="label-md" className="text-on-surface-variant">
                  Genres ({genres.length}/{MAX_TRACK_GENRES})
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {TRACK_GENRES.map((id) => {
                    const selected = genres.includes(id);
                    return (
                      <Pressable
                        key={id}
                        onPress={() => toggleGenre(id)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selected }}
                        className={`rounded-full px-3 py-1.5 ${
                          selected
                            ? 'bg-primary'
                            : 'bg-surface-container-highest'
                        }`}>
                        <Text
                          variant="caption"
                          className={
                            selected ? 'text-on-primary' : 'text-on-surface'
                          }>
                          {TRACK_GENRE_LABELS[id]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View className="gap-2">
                <Text variant="label-md" className="text-on-surface-variant">
                  Keywords (optional)
                </Text>
                <Input
                  value={keywordsText}
                  onChangeText={setKeywordsText}
                  placeholder="comma or space separated"
                  editable={!busy}
                />
              </View>
            </View>
          </ScrollView>

          <Button variant="soft" disabled={busy} onPress={() => void submit()}>
            <Text>{busy ? 'Publishing…' : 'Publish'}</Text>
          </Button>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
