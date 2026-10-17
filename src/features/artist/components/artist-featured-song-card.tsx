import { Image } from 'expo-image';
import { Pause } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';
import { FeaturedPlayIcon } from '@/shared/SVGs/featured-play-icon';
import { FeaturedSparkleIcon } from '@/shared/SVGs/featured-sparkle-icon';
import { PlaysWaveIcon } from '@/shared/SVGs/plays-wave-icon';

import type { ArtistFeaturedSong } from '../types';

const PLAY_BTN_BG = '#D0BCFF';
const PLAY_ICON = '#3C0091';
const ACCENT = '#D0BCFF';
const PLAYS_MUTED = '#958EA0';
/** Figma Master Audio pill: #A078FF @ 20% · label #D0BCFF */
const BADGE_BG = 'rgba(160, 120, 255, 0.2)';
const BADGE_TEXT = '#D0BCFF';
const PLAY_BTN_SIZE = 48;

type ArtistFeaturedSongCardProps = {
  song: ArtistFeaturedSong;
  isPlaying: boolean;
  onPlayPress: () => void;
};

export function ArtistFeaturedSongCard({
  song,
  isPlaying,
  onPlayPress,
}: ArtistFeaturedSongCardProps) {
  return (
    <View
      className="mx-4 overflow-hidden rounded-2xl border border-white/5 p-5"
      style={{
        backgroundColor: '#1B1B21',
        experimental_backgroundImage:
          'linear-gradient(160deg, #222230 0%, #1B1B21 55%, #17171D 100%)',
      }}>
      <View className="mb-4 flex-row items-center justify-between gap-3">
        <View className="flex-row items-center gap-2">
          <FeaturedSparkleIcon color={ACCENT} />
          <Text
            className="font-sans text-[13px] font-semibold uppercase leading-[18px] tracking-[0.06em]"
            style={{ color: ACCENT }}>
            Featured Song
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <PlaysWaveIcon color={PLAYS_MUTED} />
          <Text
            className="font-sans text-[12px] font-normal leading-4"
            style={{ color: PLAYS_MUTED }}>
            {song.playsLabel}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-3.5">
        <View className="h-20 w-20 overflow-hidden rounded-xl bg-surface-container-high">
          <Image
            source={{ uri: song.coverUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            recyclingKey={song.id}
          />
        </View>

        <View className="min-w-0 flex-1 gap-1.5">
          <Text
            className="font-sans text-[18px] font-bold leading-6 tracking-tight text-ink"
            numberOfLines={2}>
            {song.title}
          </Text>
          <Text className="font-sans text-[14px] font-normal leading-5 text-slate" numberOfLines={1}>
            {song.artistName} • {song.durationLabel}
          </Text>
          <View className="mt-0.5 flex-row flex-wrap items-center gap-2">
            <View
              className="h-[18px] items-center justify-center rounded-full px-2.5"
              style={{ backgroundColor: BADGE_BG }}>
              <Text
                className="font-sans text-[11px] font-medium leading-[14px]"
                style={{ color: BADGE_TEXT }}>
                {song.qualityBadge}
              </Text>
            </View>
            <Text className="font-sans text-[12px] font-normal leading-4 text-slate">
              {song.formatLabel}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={onPlayPress}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? `Pause ${song.title}` : `Play ${song.title}`}
          className="items-center justify-center overflow-hidden rounded-full"
          style={{
            width: PLAY_BTN_SIZE,
            height: PLAY_BTN_SIZE,
            backgroundColor: PLAY_BTN_BG,
            boxShadow: '0 0 18px rgba(208, 188, 255, 0.45)',
          }}>
          {isPlaying ? (
            <Pause size={20} color={PLAY_ICON} strokeWidth={2.6} fill={PLAY_ICON} />
          ) : (
            <FeaturedPlayIcon color={PLAY_ICON} width={48} height={48} />
          )}
        </Pressable>
      </View>
    </View>
  );
}
