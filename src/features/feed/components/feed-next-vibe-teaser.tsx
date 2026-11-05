import { Image } from 'expo-image';
import { ChevronUp } from 'lucide-react-native';
import { View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { FeedVibe } from '../types';
import { FeedNextUpBadgeIcon, FeedNextUpMusicIcon } from './feed-next-up-icons';

type FeedNextVibeTeaserProps = {
  nextVibe: FeedVibe;
};

/** Figma feed next-up card: 366×64, rx 12, #1B1B21 @ 85%, thumb 44×44 rx 8. */
export function FeedNextVibeTeaser({ nextVibe }: FeedNextVibeTeaserProps) {
  return (
    <View className="gap-2.5">
      <View className="items-center gap-0.5">
        <ChevronUp size={14} color="#CBC3D7" strokeWidth={2.2} />
        <Text
          className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: '#CBC3D7' }}>
          Swipe up for next vibe
        </Text>
      </View>

      <View
        className="h-16 w-full flex-row items-center"
        style={{
          borderRadius: 12,
          backgroundColor: 'rgba(27, 27, 33, 0.85)',
          paddingHorizontal: 10,
          gap: 12,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1), 0 10px 15px rgba(0,0,0,0.1)',
        }}>
        <View
          className="overflow-hidden bg-white/5"
          style={{ width: 44, height: 44, borderRadius: 8 }}>
          <Image
            source={{ uri: nextVibe.coverUrl }}
            style={{ width: 44, height: 44 }}
            contentFit="cover"
            recyclingKey={`${nextVibe.id}-next-thumb`}
          />
        </View>

        <View className="min-w-0 flex-1 justify-center gap-0.5">
          <View className="flex-row items-center gap-2">
            <Text
              className="shrink font-sans text-[14px] font-semibold leading-[18px]"
              style={{ color: '#E4E1EA' }}
              numberOfLines={1}>
              {nextVibe.title}
            </Text>
            <FeedNextUpBadgeIcon />
          </View>
          <Text
            className="font-sans text-[11px] font-normal leading-[14px]"
            style={{ color: '#CBC3D7' }}
            numberOfLines={1}>
            {nextVibe.artist} • {nextVibe.genresLabel} • {nextVibe.bpm} BPM
          </Text>
        </View>

        <View className="items-center justify-center pr-1">
          <FeedNextUpMusicIcon />
        </View>
      </View>
    </View>
  );
}
