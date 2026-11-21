import { Image } from 'expo-image';
import { Bell, MessageSquare, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Share, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/shared/components/ui/text';
import { MoreIcon } from '@/shared/SVGs/more-icon';
import { OnlineDotIcon } from '@/shared/SVGs/online-dot-icon';
import { ShareIcon } from '@/shared/SVGs/share-icon';
import { VerifiedBadgeIcon } from '@/shared/SVGs/verified-badge-icon';

import type { ArtistProfile } from '../types';

/** Figma Aura Mist hero metrics (scaled up slightly for mobile readability) */
const AVATAR_SIZE = 108;
const COVER_HEIGHT = 200;
const COVER_ACTION = '#E4E1EA';
const COVER_ACTION_BG = 'rgba(14, 14, 20, 0.7)';
const BELL_COLOR = '#F5F0FA';
/** Figma cover actions: 36 + 8 gap + 36 = 80 × 36 */
const COVER_ACTION_SIZE = 36;
const COVER_ACTIONS_GAP = 8;
const COVER_ACTIONS_INSET = 14;
/** Action row: taller pills to match larger avatar */
const ACTION_BTN_HEIGHT = 44;
const AVATAR_ACTIONS_GAP = 16;
const ACTIONS_GAP = 12;

type ArtistHeroProps = {
  profile: ArtistProfile;
  following: boolean;
  bioExpanded: boolean;
  onToggleFollow: () => void;
  onMessagePress: () => void;
  onToggleBio: () => void;
  onMorePress: () => void;
  onNotificationsPress: () => void;
};

export function ArtistHero({
  profile,
  following,
  bioExpanded,
  onToggleFollow,
  onMessagePress,
  onToggleBio,
  onMorePress,
  onNotificationsPress,
}: ArtistHeroProps) {
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
      {/* Figma: 84×44 right-flush hit area — bell left-aligned (inset from edge) */}
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
          hitSlop={8}
          className="mr-1 h-10 w-10 items-center justify-center">
          <Bell size={22} color={BELL_COLOR} strokeWidth={1.8} />
        </Pressable>
      </View>

      <View className="relative overflow-hidden bg-surface-container" style={{ height: COVER_HEIGHT }}>
        <Image
          source={{ uri: profile.coverUrl }}
          style={{ width, height: COVER_HEIGHT }}
          contentFit="cover"
          recyclingKey={`${profile.id}-cover`}
        />
        <View
          className="absolute inset-0"
          style={{
            experimental_backgroundImage:
              'linear-gradient(to bottom, rgba(13,13,13,0.12) 0%, rgba(13,13,13,0.08) 50%, rgba(19,19,25,0.88) 100%)',
          }}
        />

        {/* Figma: 80×36 — share + more, 8px gap, #0E0E14 @ 70% */}
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
            accessibilityLabel="Share artist profile"
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
            accessibilityLabel="More artist options"
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
        {/* Figma: avatar left · buttons bottom-aligned · fill remaining width */}
        <View className="w-full flex-row items-end" style={{ gap: AVATAR_ACTIONS_GAP }}>
          <View className="relative" style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}>
            <View
              className="overflow-hidden rounded-full border-[3px] border-background bg-surface-container-high"
              style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}>
              <Image
                source={{ uri: profile.avatarUrl }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                recyclingKey={`${profile.id}-avatar`}
              />
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

          <View
            className="min-w-0 flex-1 flex-row items-center"
            style={{ gap: ACTIONS_GAP, marginBottom: 4 }}>
            <Pressable
              onPress={onToggleFollow}
              accessibilityRole="button"
              accessibilityLabel={following ? `Unfollow ${profile.name}` : `Follow ${profile.name}`}
              className={`min-w-0 flex-1 flex-row items-center justify-center gap-1.5 rounded-full ${
                following ? 'border border-white/15 bg-white/10' : 'bg-primary-container'
              }`}
              style={{
                height: ACTION_BTN_HEIGHT,
                borderRadius: ACTION_BTN_HEIGHT / 2,
                ...(following
                  ? {}
                  : { boxShadow: '0 4px 20px rgba(160, 120, 255, 0.35)' }),
              }}>
              {following ? null : <Plus size={16} color="#3C0091" strokeWidth={2.5} />}
              <Text
                className={`font-sans text-[15px] leading-5 tracking-normal ${
                  following ? 'font-medium text-ink' : 'font-bold text-on-primary'
                }`}>
                {following ? 'Following' : 'Follow'}
              </Text>
            </Pressable>

            <Pressable
              onPress={onMessagePress}
              accessibilityRole="button"
              accessibilityLabel={`Message ${profile.name}`}
              className="min-w-0 flex-1 flex-row items-center justify-center gap-1.5 rounded-full border border-white/10"
              style={{
                height: ACTION_BTN_HEIGHT,
                borderRadius: ACTION_BTN_HEIGHT / 2,
                backgroundColor: 'rgba(27, 27, 33, 0.7)',
              }}>
              <MessageSquare size={16} color="#E4E1EA" strokeWidth={2} />
              <Text className="font-sans text-[15px] font-medium leading-5 tracking-normal text-ink">
                Message
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="mt-4 gap-2.5">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="font-sans text-[28px] font-bold leading-9 tracking-tight text-ink">
              {profile.name}
            </Text>
            {profile.verified ? (
              <View accessibilityLabel="Verified artist">
                <VerifiedBadgeIcon />
              </View>
            ) : null}
          </View>

          <Text className="font-sans text-[15px] leading-[22px]">
            <Text className="font-sans text-[15px] font-medium leading-[22px] text-primary-container">
              {profile.username}
            </Text>
            <Text className="font-sans text-[15px] font-normal leading-[22px] text-slate">
              {` • ${genresLabel}`}
            </Text>
          </Text>

          {/* Figma: 3 full lines clamped · More only when bio overflows */}
          <View className="gap-1">
            <Text
              className="font-sans text-[15px] font-normal leading-[22px] text-slate"
              numberOfLines={bioExpanded ? undefined : 3}>
              {profile.bio}
            </Text>
            <Text
              className="absolute left-0 right-0 opacity-0 font-sans text-[15px] font-normal leading-[22px]"
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
                className="font-sans text-[15px] font-semibold leading-[22px] text-primary-container"
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
