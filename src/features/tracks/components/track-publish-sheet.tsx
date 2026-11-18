import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/core/api/errors';
import { pickProfileImage } from '@/features/profile/utils/pick-profile-image';
import {
  MAX_TRACK_GENRES,
  MAX_TRACK_KEYWORDS,
  TRACK_GENRE_LABELS,
  TRACK_GENRES,
  type TrackGenreId,
} from '@/features/tracks/constants/track-genres';
import type { CoverContentType } from '@/features/tracks/types';
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

import { usePublishTrack, useUploadTrackCover } from '../api/hooks';
import { updateTrack } from '../api/service';

type TrackPublishSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Null while a fresh quick-record take has not been persisted yet. */
  track: { id: string; title: string } | null;
  /** Title to prefill when `track` is null (fresh take). */
  initialTitle?: string;
  bottomOffset?: number;
  /**
   * Studio only: renders the "Save to cloud" step. When provided, Publish stays
   * disabled until the parent reports the take is synced.
   */
  onSaveToCloud?: (title: string) => Promise<void>;
  canPublish?: boolean;
  synced?: boolean;
  isSyncing?: boolean;
  syncHint?: string;
  onPublished?: () => void;
  onError?: (title: string, message: string) => void;
};

function parseKeywords(text: string): string[] {
  return [
    ...new Set(
      text
        .split(/[,\s]+/)
        .map((keyword) => keyword.trim().toLowerCase())
        .filter(Boolean),
    ),
  ].slice(0, MAX_TRACK_KEYWORDS);
}

export function TrackPublishSheet({
  open,
  onOpenChange,
  track,
  initialTitle = '',
  bottomOffset,
  onSaveToCloud,
  canPublish = true,
  synced = true,
  isSyncing = false,
  syncHint,
  onPublished,
  onError,
}: TrackPublishSheetProps) {
  const uploadCover = useUploadTrackCover();
  const publishTrack = usePublishTrack();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // The sheet is lifted above the IME; shrink the scroll area so the header
  // and footer stay on-screen instead of being pushed off the top.
  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  const scrollMaxHeight = Math.max(
    160,
    Math.min(
      windowHeight * 0.7,
      windowHeight - insets.top - keyboardHeight - 240,
    ),
  );

  const [title, setTitle] = useState('');
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [coverType, setCoverType] = useState<CoverContentType | null>(null);
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');
  const [keywordsText, setKeywordsText] = useState('');
  const [genres, setGenres] = useState<TrackGenreId[]>([]);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const wasOpenRef = useRef(false);
  const pickCoverInFlightRef = useRef(false);
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setTitle(track?.title ?? initialTitle);
      setCoverUri(null);
      setCoverType(null);
      setCaption('');
      setDescription('');
      setKeywordsText('');
      setGenres([]);
      setBusy(false);
      setSubmitError(null);
      pickCoverInFlightRef.current = false;
    }
    wasOpenRef.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only on open
  }, [open]);

  const handleOpenChange = (next: boolean) => {
    if (!next && (busy || isSyncing)) {
      return;
    }
    onOpenChange(next);
  };

  const toggleGenre = (id: TrackGenreId) => {
    setGenres((prev) => {
      if (prev.includes(id)) {
        return prev.filter((genre) => genre !== id);
      }
      if (prev.length >= MAX_TRACK_GENRES) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const pickCover = async () => {
    if (pickCoverInFlightRef.current || busy || isSyncing) {
      return;
    }
    pickCoverInFlightRef.current = true;
    try {
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
    } finally {
      pickCoverInFlightRef.current = false;
    }
  };

  const handleSaveToCloud = async () => {
    if (!onSaveToCloud || busy || isSyncing) {
      return;
    }
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setSubmitError('Add a song title before saving.');
      onError?.('Title required', 'Add a song title before saving.');
      return;
    }
    setSubmitError(null);
    try {
      await onSaveToCloud(trimmedTitle);
    } catch (error) {
      const message = getErrorMessage(
        error,
        'Check your connection and try again.',
      );
      setSubmitError(message);
      onError?.('Could not back up', message);
    }
  };

  const submit = async () => {
    if (!track || busy || isSyncing) {
      return;
    }

    const trimmedTitle = title.trim();
    const keywords = parseKeywords(keywordsText);

    if (!trimmedTitle) {
      setSubmitError('Add a song title before publishing.');
      onError?.('Title required', 'Add a song title before publishing.');
      return;
    }
    if (!coverUri || !coverType) {
      setSubmitError('Add a cover image before publishing.');
      onError?.('Cover required', 'Add a cover image before publishing.');
      return;
    }
    if (genres.length < 1) {
      setSubmitError('Pick between 1 and 3 genres.');
      onError?.('Genres required', 'Pick between 1 and 3 genres.');
      return;
    }

    setSubmitError(null);
    setBusy(true);
    try {
      // Metadata-only updates keep the track SYNCED on the server (only audio
      // or layer changes invalidate the uploaded mix), so persisting a changed
      // title here is safe right before publish.
      if (trimmedTitle !== track.title.trim()) {
        await updateTrack(track.id, { title: trimmedTitle });
      }
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
      onOpenChange(false);
      onPublished?.();
    } catch (error) {
      const message = getErrorMessage(
        error,
        'Check your connection and try again.',
      );
      setSubmitError(message);
      onError?.('Publish failed', message);
    } finally {
      setBusy(false);
    }
  };

  const publishDisabled = !track || !canPublish || busy || isSyncing;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent bottomOffset={bottomOffset} className="bg-[#17171D]">
        <SheetClose />
        <SheetHeader>
          <SheetTitle>Publish</SheetTitle>
          <SheetDescription>
            {track?.title || title.trim() || 'Song'} — cover, genres, and details.
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          <ScrollView
            style={{ maxHeight: scrollMaxHeight }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <View className="gap-4 pb-4">
              <View className="gap-2">
                <Text variant="label-md" className="text-on-surface-variant">
                  Title
                </Text>
                <Input
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Song title"
                  maxLength={100}
                  editable={!busy && !isSyncing}
                />
              </View>

              <Pressable
                onPress={() => {
                  void pickCover();
                }}
                disabled={busy || isSyncing}
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
                  editable={!busy && !isSyncing}
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
                  editable={!busy && !isSyncing}
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
                        disabled={busy || isSyncing}
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
                  editable={!busy && !isSyncing}
                />
              </View>
            </View>
          </ScrollView>

          {submitError ? (
            <Text variant="caption" className="text-error">
              {submitError}
            </Text>
          ) : null}

          {onSaveToCloud ? (
            <View className="gap-2">
              <View className="flex-row gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  disabled={busy || isSyncing || synced}
                  onPress={() => void handleSaveToCloud()}>
                  <Text>
                    {synced
                      ? 'Synced to cloud'
                      : isSyncing
                        ? 'Uploading…'
                        : 'Save to cloud'}
                  </Text>
                </Button>
                <Button
                  variant="soft"
                  className="flex-1"
                  disabled={publishDisabled}
                  onPress={() => void submit()}>
                  <Text>{busy ? 'Publishing…' : 'Publish'}</Text>
                </Button>
              </View>
              {!synced ? (
                <Text variant="caption" className="text-on-surface-variant">
                  {isSyncing
                    ? 'Uploading your take to the cloud…'
                    : (syncHint ?? 'Back up to cloud first to publish.')}
                </Text>
              ) : null}
            </View>
          ) : (
            <Button
              variant="soft"
              disabled={publishDisabled}
              onPress={() => void submit()}>
              <Text>{busy ? 'Publishing…' : 'Publish'}</Text>
            </Button>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
