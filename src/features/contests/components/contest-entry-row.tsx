import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { ContestEntry } from '../api/types';

type ContestEntryRowProps = {
  entry: ContestEntry;
  canVote?: boolean;
  votePending?: boolean;
  onVote?: () => void;
};

export function ContestEntryRow({
  entry,
  canVote = false,
  votePending = false,
  onVote,
}: ContestEntryRowProps) {
  const artist = entry.name?.trim() || entry.username;

  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-white/5 bg-surface-container px-3 py-3">
      <View className="h-14 w-14 overflow-hidden rounded-xl bg-surface-container-high">
        {entry.trackCoverUrl ? (
          <Image
            source={{ uri: entry.trackCoverUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            recyclingKey={entry.id}
          />
        ) : null}
      </View>

      <View className="min-w-0 flex-1 gap-0.5">
        <Text variant="title-md" className="text-on-surface" numberOfLines={1}>
          {entry.trackTitle}
        </Text>
        <Text
          variant="body-md"
          className="text-on-surface-variant"
          numberOfLines={1}>
          @{entry.username}
          {artist !== entry.username ? ` · ${artist}` : ''}
        </Text>
        {typeof entry.voteCount === 'number' ? (
          <Text variant="caption" className="text-on-surface-variant">
            {entry.voteCount} votes
          </Text>
        ) : null}
      </View>

      {canVote && onVote ? (
        <Pressable
          onPress={onVote}
          disabled={votePending}
          accessibilityRole="button"
          accessibilityLabel={`Vote for ${entry.trackTitle}`}
          className="h-10 min-w-18 items-center justify-center rounded-full bg-primary-tonal px-4 disabled:opacity-50">
          <Text variant="title-md" className="text-[#3C0091]">
            Vote
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
