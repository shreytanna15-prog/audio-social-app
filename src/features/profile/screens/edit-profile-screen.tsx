import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getErrorMessage, isApiError } from '@/core/api';
import {
  fieldClassName,
  textareaClassName,
  useFeedbackDialog,
} from '@/shared/components/ui';
import { Input } from '@/shared/components/ui/input';
import { Text } from '@/shared/components/ui/text';
import { Textarea } from '@/shared/components/ui/textarea';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

import {
  useDeleteAvatar,
  useDeleteCover,
  useMe,
  usePatchMe,
  useUploadAvatar,
  useUploadCover,
  useUsernameAvailability,
} from '../api/hooks';
import { ProfileMediaSheet } from '../components/profile-media-sheet';
import { pickProfileImage } from '../utils/pick-profile-image';
import { profileInitial } from '../utils/profile-initial';

const AVATAR_SIZE = 96;
const COVER_HEIGHT = 140;
const BIO_MAX = 300;
const NAME_MAX = 30;
const HEADER_BAR_HEIGHT = 48;
/** Match profile-hero cover action chips */
const MEDIA_ACTION_ICON = '#E4E1EA';
const MEDIA_ACTION_BG = 'rgba(14, 14, 20, 0.72)';
const MEDIA_ACTION_SIZE = 32;
/** Extra room under the form while the keyboard is open (not full keyboard height). */
const KEYBOARD_SCROLL_PAD = 160;

function formatUnlockDate(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

/** Edit Profile — text Save + independent media upload flows. */
export function EditProfileScreen() {
  const { back } = useRouter();
  const { guard } = useNavigationGuard();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const meQuery = useMe();
  const patchMe = usePatchMe();
  const uploadAvatar = useUploadAvatar();
  const uploadCover = useUploadCover();
  const removeAvatar = useDeleteAvatar();
  const removeCover = useDeleteCover();
  const scrollRef = useRef<ScrollView>(null);
  const { showError, dialog: feedbackDialog } = useFeedbackDialog();

  const me = meQuery.data;

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [debouncedUsername, setDebouncedUsername] = useState('');
  const [mediaTarget, setMediaTarget] = useState<'avatar' | 'cover' | null>(
    null,
  );
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const bioFocusedRef = useRef(false);

  useEffect(() => {
    if (!me || hydrated) return;
    setName(me.name ?? '');
    setUsername(me.username);
    setBio(me.bio ?? '');
    setDebouncedUsername(me.username);
    setHydrated(true);
  }, [me, hydrated]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedUsername(username.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(handle);
  }, [username]);

  const scrollBioIntoView = () => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, Platform.OS === 'ios' ? 60 : 100);
    });
  };

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      if (bioFocusedRef.current) {
        scrollBioIntoView();
      }
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  const headerHeight = insets.top + HEADER_BAR_HEIGHT;
  const scrollBottomPad =
    insets.bottom + 16 + (keyboardHeight > 0 ? KEYBOARD_SCROLL_PAD : 0);

  const canChangeUsername = me?.canChangeUsername ?? true;
  const usernameDirty =
    hydrated && me != null && username.trim().toLowerCase() !== me.username;
  const availabilityQuery = useUsernameAvailability(
    debouncedUsername,
    Boolean(canChangeUsername && usernameDirty && debouncedUsername.length >= 3),
  );

  const dirty = useMemo(() => {
    if (!me || !hydrated) return false;
    return (
      (name.trim() || null) !== (me.name ?? null) ||
      (bio.trim() || null) !== (me.bio ?? null) ||
      username.trim().toLowerCase() !== me.username
    );
  }, [me, hydrated, name, bio, username]);

  const usernameHint = (() => {
    if (!canChangeUsername) {
      return `Username can change again on ${formatUnlockDate(me?.usernameChangeAvailableAt ?? null)}`;
    }
    if (!usernameDirty) return null;
    if (availabilityQuery.isFetching) return 'Checking availability…';
    if (availabilityQuery.data && !availabilityQuery.data.available) {
      return 'Username is taken';
    }
    if (availabilityQuery.data?.available) return 'Username is available';
    return null;
  })();

  const mediaBusy =
    uploadAvatar.isPending ||
    uploadCover.isPending ||
    removeAvatar.isPending ||
    removeCover.isPending;

  const onSave = async () => {
    if (!me || !dirty || patchMe.isPending) return;

    if (usernameDirty && !canChangeUsername) {
      showError(
        'Username locked',
        `You can change your username again on ${formatUnlockDate(me.usernameChangeAvailableAt)}.`,
      );
      return;
    }

    if (
      usernameDirty &&
      availabilityQuery.data &&
      !availabilityQuery.data.available
    ) {
      showError('Username taken', 'Choose a different username.');
      return;
    }

    const body: {
      name?: string | null;
      bio?: string | null;
      username?: string;
    } = {};

    const nextName = name.trim() || null;
    const nextBio = bio.trim() || null;
    if (nextName !== (me.name ?? null)) body.name = nextName;
    if (nextBio !== (me.bio ?? null)) body.bio = nextBio;
    if (usernameDirty && canChangeUsername) {
      body.username = username.trim().toLowerCase();
    }

    try {
      await patchMe.mutateAsync(body);
      guard(() => back());
    } catch (error) {
      const message = isApiError(error)
        ? error.message
        : getErrorMessage(error);
      showError('Could not save', message);
    }
  };

  const runPick = async (
    source: 'camera' | 'library',
    kind: 'avatar' | 'cover',
  ) => {
    setMediaTarget(null);
    const picked = await pickProfileImage({ source, kind });
    if (!picked.ok) {
      if (!picked.canceled) {
        showError(picked.title, picked.message);
      }
      return;
    }
    try {
      const payload = {
        localUri: picked.uri,
        contentType: picked.contentType,
      };
      if (kind === 'avatar') {
        await uploadAvatar.mutateAsync(payload);
      } else {
        await uploadCover.mutateAsync(payload);
      }
    } catch (error) {
      showError(
        'Upload failed',
        isApiError(error) ? error.message : getErrorMessage(error),
      );
    }
  };

  const onRemoveMedia = async () => {
    const kind = mediaTarget;
    setMediaTarget(null);
    if (!kind) return;
    try {
      if (kind === 'avatar') await removeAvatar.mutateAsync();
      else await removeCover.mutateAsync();
    } catch (error) {
      showError(
        'Remove failed',
        isApiError(error) ? error.message : getErrorMessage(error),
      );
    }
  };

  if (meQuery.isLoading && !me) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#D0BCFF" />
      </View>
    );
  }

  if (meQuery.isError || !me) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background px-6">
        <Text variant="body-md" className="text-center text-on-surface-variant">
          Could not load your profile.
        </Text>
        <Pressable
          onPress={() => void meQuery.refetch()}
          accessibilityRole="button">
          <Text variant="title-md" className="text-primary-tonal">
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  const initial = profileInitial(name || me.name, username || me.username);

  const body = (
    <>
      <View
        className="flex-row items-center justify-between border-b border-white/5 px-2"
        style={{ paddingTop: insets.top, height: headerHeight }}>
        <Pressable
          onPress={() => guard(() => back())}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          className="min-w-18 px-2 py-2">
          <Text variant="title-md" className="text-on-surface-variant">
            Cancel
          </Text>
        </Pressable>
        <Text variant="title-md" className="text-on-surface">
          Edit Profile
        </Text>
        <Pressable
          onPress={() => void onSave()}
          disabled={!dirty || patchMe.isPending}
          accessibilityRole="button"
          accessibilityLabel="Save"
          className="min-w-18 items-end px-2 py-2">
          {patchMe.isPending ? (
            <ActivityIndicator color="#D0BCFF" />
          ) : (
            <Text
              variant="title-md"
              className={
                dirty ? 'text-primary-tonal' : 'text-on-surface-variant/50'
              }>
              Save
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        nestedScrollEnabled
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        contentContainerStyle={{
          paddingBottom: scrollBottomPad,
        }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator>
        <View>
          <Pressable
            onPress={() => setMediaTarget('cover')}
            accessibilityRole="button"
            accessibilityLabel="Edit cover photo"
            className="relative overflow-hidden bg-surface-container"
            style={{ height: COVER_HEIGHT }}>
            {me.coverUrl ? (
              <Image
                source={{ uri: me.coverUrl }}
                style={{ width, height: COVER_HEIGHT }}
                contentFit="cover"
                recyclingKey={`${me.id}-edit-cover`}
              />
            ) : (
              <View className="h-full w-full items-center justify-center bg-surface-container-high">
                <Text variant="label-md" className="text-on-surface-variant">
                  Add cover photo
                </Text>
              </View>
            )}
            <View
              className="absolute bottom-3 right-3 items-center justify-center overflow-hidden"
              style={{
                width: MEDIA_ACTION_SIZE,
                height: MEDIA_ACTION_SIZE,
                borderRadius: MEDIA_ACTION_SIZE / 2,
                backgroundColor: MEDIA_ACTION_BG,
              }}>
              <Camera size={16} color={MEDIA_ACTION_ICON} strokeWidth={2} />
            </View>
            {mediaBusy ? (
              <View className="absolute inset-0 items-center justify-center bg-black/40">
                <ActivityIndicator color="#D0BCFF" />
              </View>
            ) : null}
          </Pressable>

          <View className="px-4" style={{ marginTop: -(AVATAR_SIZE / 2) }}>
            <View
              className="relative"
              style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}>
              <Pressable
                onPress={() => setMediaTarget('avatar')}
                accessibilityRole="button"
                accessibilityLabel="Edit profile photo"
                className="overflow-hidden rounded-full border-[3px] border-background bg-surface-container-high"
                style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}>
                {me.avatarUrl ? (
                  <Image
                    source={{ uri: me.avatarUrl }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    recyclingKey={`${me.id}-edit-avatar`}
                  />
                ) : (
                  <View className="h-full w-full items-center justify-center bg-primary-tonal">
                    <Text className="font-sans text-[36px] font-bold text-on-primary">
                      {initial}
                    </Text>
                  </View>
                )}
              </Pressable>
              <Pressable
                onPress={() => setMediaTarget('avatar')}
                accessibilityRole="button"
                accessibilityLabel="Change profile photo"
                hitSlop={6}
                className="absolute bottom-0 right-0 items-center justify-center overflow-hidden"
                style={{
                  width: MEDIA_ACTION_SIZE,
                  height: MEDIA_ACTION_SIZE,
                  borderRadius: MEDIA_ACTION_SIZE / 2,
                  backgroundColor: MEDIA_ACTION_BG,
                  transform: [{ translateX: 2 }, { translateY: 2 }],
                }}>
                <Camera size={16} color={MEDIA_ACTION_ICON} strokeWidth={2} />
              </Pressable>
            </View>
          </View>
        </View>

        <View className="mt-6 gap-5 px-4">
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text variant="label-sm" className="text-on-surface-variant uppercase">
                Display name
              </Text>
              <Text variant="caption" className="text-outline">
                {name.length} / {NAME_MAX}
              </Text>
            </View>
            <Input
              value={name}
              onChangeText={(value) => setName(value.slice(0, NAME_MAX))}
              placeholder="Your name"
              maxLength={NAME_MAX}
              autoCapitalize="words"
              autoCorrect={false}
              className={fieldClassName}
            />
          </View>

          <View className="gap-2">
            <Text variant="label-sm" className="text-on-surface-variant uppercase">
              Username
            </Text>
            <Input
              value={username}
              onChangeText={(value) =>
                setUsername(value.toLowerCase().replace(/[^a-z0-9._]/g, ''))
              }
              editable={canChangeUsername}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="username"
              className={fieldClassName}
            />
            {usernameHint ? (
              <Text
                variant="caption"
                className={
                  usernameHint.includes('taken')
                    ? 'text-error'
                    : 'text-on-surface-variant'
                }>
                {usernameHint}
              </Text>
            ) : null}
          </View>

          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text variant="label-sm" className="text-on-surface-variant uppercase">
                Bio
              </Text>
              <Text variant="caption" className="text-outline">
                {bio.length} / {BIO_MAX}
              </Text>
            </View>
            <Textarea
              value={bio}
              onChangeText={(value) => setBio(value.slice(0, BIO_MAX))}
              onFocus={() => {
                bioFocusedRef.current = true;
                scrollBioIntoView();
              }}
              onBlur={() => {
                bioFocusedRef.current = false;
              }}
              placeholder="Tell people about your sound"
              maxLength={BIO_MAX}
              numberOfLines={4}
              // Critical on Android: multiline inputs steal vertical drags from ScrollView.
              scrollEnabled={false}
              className={textareaClassName}
              style={{ minHeight: 100 }}
            />
          </View>
        </View>
      </ScrollView>

      <ProfileMediaSheet
        open={mediaTarget != null}
        onOpenChange={(open) => {
          if (!open) setMediaTarget(null);
        }}
        title={mediaTarget === 'cover' ? 'Cover photo' : 'Profile photo'}
        canRemove={
          mediaTarget === 'avatar' ? Boolean(me.avatarUrl) : Boolean(me.coverUrl)
        }
        onTakePhoto={() => {
          if (mediaTarget) void runPick('camera', mediaTarget);
        }}
        onChooseGallery={() => {
          if (mediaTarget) void runPick('library', mediaTarget);
        }}
        onRemove={() => void onRemoveMedia()}
      />

      {feedbackDialog}
    </>
  );

  if (Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView
        className="flex-1 bg-background"
        behavior="padding"
        keyboardVerticalOffset={headerHeight}>
        {body}
      </KeyboardAvoidingView>
    );
  }

  // Android uses softwareKeyboardLayoutMode "resize" — avoid KeyboardAvoidingView.
  return <View className="flex-1 bg-background">{body}</View>;
}
