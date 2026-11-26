import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { MADE_FOR_YOU_QUERY_KEY } from '@/features/discover';
import {
  GENRES,
  GenreCard,
  MAX_PREFERRED_GENRES,
  type Genre,
} from '@/features/onboarding';
import { useMe, usePatchMe } from '@/features/profile';
import type { TrackGenreId } from '@/features/tracks/constants/track-genres';
import { ScreenHeader } from '@/shared/components/layout/screen-header';
import { Button } from '@/shared/components/ui/button';
import { useFeedbackDialog } from '@/shared/components/ui/feedback-dialog';
import { Text } from '@/shared/components/ui/text';
import { ApiError } from '@/core/api';

function isTrackGenreId(id: string): id is TrackGenreId {
  return GENRES.some((genre) => genre.id === id);
}

export function PreferredGenresScreen() {
  const { back } = useRouter();
  const queryClient = useQueryClient();
  const { data: me, isPending: isMePending } = useMe();
  const patchMe = usePatchMe();
  const { show, showError, dialog } = useFeedbackDialog();
  const [selected, setSelected] = useState<Set<TrackGenreId>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!me || hydrated) return;
    const ids = (me.preferredGenres ?? []).filter(isTrackGenreId);
    setSelected(new Set(ids));
    setHydrated(true);
  }, [me, hydrated]);

  const count = selected.size;
  const serverIds = new Set(
    (me?.preferredGenres ?? []).filter(isTrackGenreId),
  );
  const dirty =
    count !== serverIds.size ||
    [...selected].some((id) => !serverIds.has(id));

  const toggle = (genre: Genre) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(genre.id)) {
        next.delete(genre.id);
        return next;
      }
      if (next.size >= MAX_PREFERRED_GENRES) {
        showError(
          'Genre limit',
          `Pick up to ${MAX_PREFERRED_GENRES} genres for now.`,
        );
        return current;
      }
      next.add(genre.id);
      return next;
    });
  };

  const onSave = async () => {
    if (!dirty || patchMe.isPending) return;
    try {
      await patchMe.mutateAsync({
        preferredGenres: [...selected],
      });
      void queryClient.invalidateQueries({ queryKey: MADE_FOR_YOU_QUERY_KEY });
      show({
        title: 'Genres saved',
        message: 'Home recommendations will use your updated taste.',
        actions: [
          {
            label: 'OK',
            variant: 'soft',
            onPress: () => back(),
          },
        ],
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Could not save preferred genres.';
      showError('Save failed', message);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title="Preferred genres"
        right={
          <Button
            variant="ghost"
            size="sm"
            disabled={!dirty || patchMe.isPending || !hydrated}
            onPress={() => {
              void onSave();
            }}>
            <Text className="text-primary-tonal">
              {patchMe.isPending ? 'Saving…' : 'Save'}
            </Text>
          </Button>
        }
      />

      {isMePending && !hydrated ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D0BCFF" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-4 pb-10 pt-4"
          showsVerticalScrollIndicator={false}>
          <View className="gap-1">
            <Text variant="body-md" className="text-on-surface-variant">
              Pick up to {MAX_PREFERRED_GENRES} genres to personalize Home.
              Clearing all removes taste signals.
            </Text>
            {count > 0 ? (
              <Text variant="label-md" className="text-primary-tonal">
                {count}/{MAX_PREFERRED_GENRES} selected
              </Text>
            ) : null}
          </View>

          <View className="flex-row flex-wrap" style={{ gap: 12 }}>
            {GENRES.map((genre) => (
              <View key={genre.id} style={{ flexBasis: '48%', flexGrow: 1 }}>
                <GenreCard
                  genre={genre}
                  selected={selected.has(genre.id)}
                  onPress={() => toggle(genre)}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      )}
      {dialog}
    </View>
  );
}
