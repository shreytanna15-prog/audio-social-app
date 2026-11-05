import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { FeedVibe } from '../types';
import { FeedVerifiedBadge } from './feed-verified-badge';
import { FeedVibeSubtitleMark } from './feed-vibe-subtitle-mark';

const ACCENT = '#D0BCFF';
const FOLLOW_BG = '#34343B';
const META_MUTED = '#CBC3D7';

type FeedVibeMetaProps = {
  vibe: FeedVibe;
  following: boolean;
  onFollowPress: () => void;
  onArtistPress?: () => void;
};

export function FeedVibeMeta({
  vibe,
  following,
  onFollowPress,
  onArtistPress,
}: FeedVibeMetaProps) {
  return (
    <View className="gap-3">
      <View className="flex-row items-baseline gap-x-1.5">
        <Text
          className="min-w-0 shrink font-sans text-[26px] font-bold leading-8 tracking-tight text-white"
          numberOfLines={1}>
          {vibe.title}
        </Text>
        {vibe.subtitle === '(Vocal Stem Flip)' ? (
          <View className="shrink-0 self-center">
            <FeedVibeSubtitleMark width={133} height={18} />
          </View>
        ) : vibe.subtitle ? (
          <Text
            className="shrink-0 font-display text-[18px] font-normal leading-7 tracking-tight"
            style={{ color: ACCENT }}
            numberOfLines={1}>
            {vibe.subtitle}
          </Text>
        ) : null}
      </View>

      <View className="flex-row items-center gap-2.5">
        <Pressable
          onPress={onArtistPress}
          accessibilityRole="button"
          accessibilityLabel={`Open ${vibe.artist} profile`}
          className="h-10 w-10 overflow-hidden rounded-full bg-white/15">
          <Image
            source={{ uri: vibe.artistAvatarUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            recyclingKey={`${vibe.id}-avatar`}
          />
        </Pressable>

        <View className="min-w-0 flex-1 gap-0.5">
          <View className="flex-row items-center justify-between gap-3">
            <Pressable
              onPress={onArtistPress}
              accessibilityRole="button"
              className="min-w-0 shrink flex-row items-center gap-1.5">
              <Text
                className="font-sans text-[16px] font-semibold leading-5 text-white"
                numberOfLines={1}>
                {vibe.artist}
              </Text>
              {vibe.verified ? (
                <FeedVerifiedBadge width={17} height={16} />
              ) : null}
            </Pressable>

            <Pressable
              onPress={onFollowPress}
              accessibilityRole="button"
              accessibilityLabel={
                following ? `Unfollow ${vibe.artist}` : `Follow ${vibe.artist}`
              }
              className="shrink-0 items-center justify-center"
              style={{
                height: 28,
                paddingHorizontal: 14,
                borderRadius: 14,
                backgroundColor: FOLLOW_BG,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}>
              <Text
                className="font-sans text-[13px] font-semibold leading-4"
                style={{ color: ACCENT }}>
                {following ? 'Following' : '+ Follow'}
              </Text>
            </Pressable>
          </View>

          <Text
            className="font-sans text-[13px] font-normal leading-4"
            style={{ color: META_MUTED }}
            numberOfLines={1}>
            {vibe.genresLabel} • {vibe.bpm} BPM
          </Text>
        </View>
      </View>
    </View>
  );
}
