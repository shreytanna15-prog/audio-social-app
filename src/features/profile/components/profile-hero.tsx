import { Image } from 'expo-image';
import { type ReactNode, useState } from 'react';
import { Pressable, Share, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/shared/components/ui/text';
import { BellIcon } from '@/shared/SVGs/bell-icon';
import { MoreIcon } from '@/shared/SVGs/more-icon';
import { OnlineDotIcon } from '@/shared/SVGs/online-dot-icon';
import { ShareIcon } from '@/shared/SVGs/share-icon';
import { VerifiedBadgeIcon } from '@/shared/SVGs/verified-badge-icon';

import type { Profile } from '../types';

/** Figma Aura Mist hero metrics (scaled up slightly for mobile readability) */
const AVATAR_SIZE = 108;
const COVER_HEIGHT = 200;
const COVER_ACTION = '#E4E1EA';
const COVER_ACTION_BG = 'rgba(14, 14, 20, 0.7)';
const BELL_ICON = '#CBC3D7';
const COVER_ACTION_SIZE = 36;
const COVER_ACTIONS_GAP = 8;
const COVER_ACTIONS_INSET = 14;
const AVATAR_ACTIONS_GAP = 16;

type ProfileHeroProps = {
  profile: Profile;
  /** Follow/Message or Edit/Library — owned by the screen. */
  actions: ReactNode;
  bioExpanded: boolean;
  onToggleBio: () => void;
  onMorePress: () => void;
  onNotificationsPress: () => void;
};

export function ProfileHero({
  profile,
  actions,
  bioExpanded,
  onToggleBio,
  onMorePress,
  onNotificationsPress,
}: ProfileHeroProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const onShareProfile = () => {
    void Share.share({
      message: `Check out ${profile.name} (${profile.username}) on VibeOGram`,
    });
  };

  const genresLabel = profile.genres.join(' • ');
  const [bioOverflows, setBioOverflows] = useState(false);

  return (
    <View>
      <View
        className="flex-row items-center justify-end bg-background"
        style={{
          paddingTop: insets.top,
          height: insets.top + 44,
        }}>
        <Pressable
          onPress={onNotificationsPress}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          style={{
            width: 84,
            height: 44,
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingLeft: 0,
          }}>
          <BellIcon color={BELL_ICON} />
        </Pressable>
      </View>

      <View className="relative overflow-hidden bg-surface-container" style={{ height: COVER_HEIGHT }}>
        {profile.coverUrl ? (
          <Image
            source={{ uri: profile.coverUrl }}
            style={{ width, height: COVER_HEIGHT }}
            contentFit="cover"
            recyclingKey={`${profile.id}-cover`}
          />
        ) : (
          <View
            className="bg-surface-container-high"
            style={{ width, height: COVER_HEIGHT }}
          />
        )}
        <View
          className="absolute inset-0"
          style={{
            experimental_backgroundImage:
              'linear-gradient(to bottom, rgba(13,13,13,0.12) 0%, rgba(13,13,13,0.08) 50%, rgba(19,19,25,0.88) 100%)',
          }}
        />

        <View
          className="absolute flex-row items-center"
          style={{
            top: COVER_ACTIONS_INSET,
            right: COVER_ACTIONS_INSET,
            gap: COVER_ACTIONS_GAP,
            width: COVER_ACTION_SIZE * 2 + COVER_ACTIONS_GAP,
            height: COVER_ACTION_SIZE,
          }}>
          <Pressable
            onPress={onShareProfile}
            accessibilityRole="button"
            accessibilityLabel="Share profile"
            style={{
              width: COVER_ACTION_SIZE,
              height: COVER_ACTION_SIZE,
              borderRadius: COVER_ACTION_SIZE / 2,
              backgroundColor: COVER_ACTION_BG,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
            <ShareIcon color={COVER_ACTION} />
          </Pressable>
          <Pressable
            onPress={onMorePress}
            accessibilityRole="button"
            accessibilityLabel="More profile options"
            style={{
              width: COVER_ACTION_SIZE,
              height: COVER_ACTION_SIZE,
              borderRadius: COVER_ACTION_SIZE / 2,
              backgroundColor: COVER_ACTION_BG,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
            <MoreIcon color={COVER_ACTION} />
          </Pressable>
        </View>
      </View>

      <View className="px-4" style={{ marginTop: -(AVATAR_SIZE / 2) }}>
        <View className="w-full flex-row items-end" style={{ gap: AVATAR_ACTIONS_GAP }}>
          <View className="relative" style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}>
            <View
              className="overflow-hidden rounded-full border-[3px] border-background bg-surface-container-high"
              style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}>
              {profile.avatarUrl ? (
                <Image
                  source={{ uri: profile.avatarUrl }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  recyclingKey={`${profile.id}-avatar`}
                />
              ) : (
                <View className="h-full w-full items-center justify-center bg-primary-tonal">
                  <Text className="font-sans text-[36px] font-bold text-on-primary">
                    {(profile.name.trim() || profile.username.replace('@', ''))
                      .charAt(0)
                      .toUpperCase() || '?'}
                  </Text>
                </View>
              )}
            </View>
            {profile.isOnline ? (
              <View
                className="absolute"
                style={{ bottom: 4, right: 4 }}
                accessibilityLabel="Online">
                <OnlineDotIcon />
              </View>
            ) : null}
          </View>

          <View className="min-w-0 flex-1" style={{ marginBottom: 4 }}>
            {actions}
          </View>
        </View>

        <View className="mt-4 gap-2.5">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="font-sans text-[28px] font-bold leading-9 tracking-tight text-ink">
              {profile.name}
            </Text>
            {profile.verified ? (
              <View accessibilityLabel="Verified">
                <VerifiedBadgeIcon />
              </View>
            ) : null}
          </View>

          <Text className="font-sans text-[15px] leading-5.5">
            <Text className="font-sans text-[15px] font-medium leading-5.5 text-primary-container">
              {profile.username}
            </Text>
            <Text className="font-sans text-[15px] font-normal leading-5.5 text-slate">
              {` • ${genresLabel}`}
            </Text>
          </Text>

          <View className="gap-1">
            <Text
              className="font-sans text-[15px] font-normal leading-5.5 text-slate"
              numberOfLines={bioExpanded ? undefined : 3}>
              {profile.bio}
            </Text>
            <Text
              className="absolute left-0 right-0 opacity-0 font-sans text-[15px] font-normal leading-5.5"
              pointerEvents="none"
              onTextLayout={(e) => {
                setBioOverflows((prev) => {
                  const next = e.nativeEvent.lines.length > 3;
                  return prev === next ? prev : next;
                });
              }}>
              {profile.bio}
            </Text>
            {bioOverflows || bioExpanded ? (
              <Text
                className="font-sans text-[15px] font-semibold leading-5.5 text-primary-container"
                onPress={onToggleBio}
                accessibilityRole="link">
                {bioExpanded ? 'Less' : 'More'}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}
