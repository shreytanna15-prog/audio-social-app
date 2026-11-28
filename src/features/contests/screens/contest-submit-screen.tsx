import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Check, Music2, Upload } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/shared/components/layout/screen-header';
import { Text } from '@/shared/components/ui/text';
import { TRACK_GENRE_LABELS } from '@/features/tracks/constants/track-genres';
import type { TrackGenreId } from '@/features/tracks/constants/track-genres';

import {
  useContest,
  useEligibleTracks,
  useSubmitContestEntry,
} from '../api/hooks';
import type { EligibleTrack } from '../api/types';

function genreLabel(id: string) {
  return TRACK_GENRE_LABELS[id as TrackGenreId] ?? id;
}

function EligibleTrackRow({
  track,
  selected,
  disabled,
  onSelect,
}: {
  track: EligibleTrack;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      onPress={onSelect}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Select ${track.title}`}
      className={`flex-row items-center gap-3 rounded-2xl border px-3 py-3 ${
        selected
          ? 'border-primary-tonal bg-primary-tonal/10'
          : 'border-white/5 bg-surface-container'
      } ${disabled ? 'opacity-50' : ''}`}>
      <View className="h-14 w-14 overflow-hidden rounded-xl bg-surface-container-high">
        {track.coverUrl ? (
          <Image
            source={{ uri: track.coverUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            recyclingKey={track.id}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Music2 size={20} color="#CBC3D7" strokeWidth={1.8} />
          </View>
        )}
      </View>

      <View className="min-w-0 flex-1 gap-1">
        <Text variant="title-md" className="text-on-surface" numberOfLines={1}>
          {track.title}
        </Text>
        {track.genres.length > 0 ? (
          <View className="flex-row flex-wrap gap-1.5">
            {track.genres.slice(0, 3).map((genreId) => (
              <View
                key={genreId}
                className="rounded-full bg-surface-container-high px-2 py-0.5">
                <Text variant="caption" className="text-on-surface-variant">
                  {genreLabel(genreId)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View
        className={`h-6 w-6 items-center justify-center rounded-full border ${
          selected
            ? 'border-primary-tonal bg-primary-tonal'
            : 'border-outline-variant bg-transparent'
        }`}>
        {selected ? (
          <Check size={14} color="#3C0091" strokeWidth={2.6} />
        ) : null}
      </View>
    </Pressable>
  );
}

export function ContestSubmitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const contestQuery = useContest(id);
  const eligible = useEligibleTracks(id);
  const submit = useSubmitContestEntry(id);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  const tracks = eligible.data ?? [];
  const selectedTrack = tracks.find((t) => t.id === selectedTrackId) ?? null;
  const bottomPad = Math.max(insets.bottom, 12);
  const hasSticky = tracks.length > 0;

  const onConfirm = () => {
    if (!selectedTrackId) return;
    submit.mutate(selectedTrackId, {
      onSuccess: () => {
        router.replace(`/contests/${id}` as Href);
      },
    });
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Submit entry" />

      {eligible.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D0BCFF" />
        </View>
      ) : eligible.isError ? (
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <Text
            variant="body-md"
            className="text-center text-on-surface-variant">
            Could not load eligible tracks.
          </Text>
          <Pressable onPress={() => void eligible.refetch()}>
            <Text variant="title-md" className="text-primary-tonal">
              Retry
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={tracks}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 8,
              paddingBottom: bottomPad + (hasSticky ? 100 : 24),
              gap: 10,
              flexGrow: 1,
            }}
            ListHeaderComponent={
              <View className="gap-3 pb-4">
                <View className="gap-1 rounded-2xl border border-white/5 bg-surface-container p-4">
                  <Text variant="label-sm" className="text-on-surface-variant">
                    Contest
                  </Text>
                  <Text
                    variant="title-md"
                    className="text-on-surface"
                    numberOfLines={2}>
                    {contestQuery.data?.title ?? 'Loading…'}
                  </Text>
                  <Text variant="body-md" className="text-on-surface-variant">
                    Pick one published track that matches the contest genres.
                    You cannot swap it after submit.
                  </Text>
                </View>
                {tracks.length > 0 ? (
                  <Text
                    variant="label-sm"
                    className="uppercase text-on-surface-variant">
                    Eligible tracks · {tracks.length}
                  </Text>
                ) : null}
              </View>
            }
            ListEmptyComponent={
              <View className="items-center gap-3 rounded-2xl border border-white/5 bg-surface-container px-5 py-10">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-surface-container-high">
                  <Upload size={22} color="#D0BCFF" strokeWidth={2} />
                </View>
                <Text
                  variant="title-md"
                  className="text-center text-on-surface">
                  No eligible tracks
                </Text>
                <Text
                  variant="body-md"
                  className="text-center text-on-surface-variant">
                  Publish a track whose genres match this contest, then come
                  back to enter.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <EligibleTrackRow
                track={item}
                selected={item.id === selectedTrackId}
                disabled={submit.isPending}
                onSelect={() => setSelectedTrackId(item.id)}
              />
            )}
          />

          {hasSticky ? (
            <View
              className="border-t border-white/5 bg-background px-4 pt-3"
              style={{ paddingBottom: bottomPad }}>
              {selectedTrack ? (
                <Text
                  variant="caption"
                  className="mb-2 text-center text-on-surface-variant"
                  numberOfLines={1}>
                  Selected · {selectedTrack.title}
                </Text>
              ) : null}
              <Pressable
                onPress={onConfirm}
                disabled={!selectedTrackId || submit.isPending}
                accessibilityRole="button"
                className={`h-12 flex-row items-center justify-center gap-2 rounded-full ${
                  selectedTrackId
                    ? 'bg-primary-tonal'
                    : 'bg-surface-container-high'
                } disabled:opacity-60`}>
                {submit.isPending ? (
                  <ActivityIndicator color="#3C0091" />
                ) : (
                  <>
                    <Upload
                      size={16}
                      color={selectedTrackId ? '#3C0091' : '#958EA0'}
                      strokeWidth={2.2}
                    />
                    <Text
                      variant="title-md"
                      className={
                        selectedTrackId
                          ? 'text-[#3C0091]'
                          : 'text-on-surface-variant'
                      }>
                      {selectedTrackId
                        ? 'Confirm entry'
                        : 'Select a track'}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}
