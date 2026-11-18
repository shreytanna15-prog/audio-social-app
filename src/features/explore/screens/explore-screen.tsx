import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePlayerStore } from '@/features/player';
import {
  ChallengeCard,
  CuratedPlaylistsSection,
  FeaturedArtistsSection,
  TrendingSection,
} from '@/shared/components/music';
import { Text } from '@/shared/components/ui/text';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

import { ExploreFilterChips } from '../components/explore-filter-chips';
import { ExploreSearchBar } from '../components/explore-search-bar';
import { ExploreSongCard } from '../components/explore-song-card';
import { RisingCreatorCard } from '../components/rising-creator-card';
import { EXPLORE_FILTERS } from '../data/explore-filters';
import { FEATURED_SONG } from '../data/featured-song';
import { RISING_CREATOR } from '../data/rising-creator';

export function ExploreScreen() {
  const { push } = useRouter();
  const { guard } = useNavigationGuard();
  const insets = useSafeAreaInsets();
  const play = usePlayerStore((s) => s.play);
  const [selectedFilterId, setSelectedFilterId] = useState(EXPLORE_FILTERS[0]?.id ?? 'all');

  const playFeatured = () => {
    play({
      id: `explore-${FEATURED_SONG.id}`,
      title: FEATURED_SONG.title,
      artist: FEATURED_SONG.artist,
      coverUrl: FEATURED_SONG.coverUrl,
    });
  };

  const playRisingSample = () => {
    play({
      id: `rising-${RISING_CREATOR.id}`,
      title: RISING_CREATOR.sampleTitle ?? RISING_CREATOR.name,
      artist: RISING_CREATOR.name,
      coverUrl: RISING_CREATOR.avatarUrl,
    });
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 8 }}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 pb-8"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <ExploreSearchBar onPress={() => guard(() => push('/explore/search' as Href))} />

        <ExploreFilterChips
          selectedId={selectedFilterId}
          onSelect={setSelectedFilterId}
        />

        <View className="gap-4">
          <View className="flex-row items-baseline justify-between gap-3 px-4">
            <View className="min-w-0 flex-1 flex-row flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <Text variant="title-lg" className="text-on-surface">
                Find Your Sound
              </Text>
              <Text variant="body-md" className="text-on-surface-variant">
                Curated Worlds
              </Text>
            </View>

            <Pressable accessibilityRole="link" hitSlop={8}>
              <Text variant="label-md" className="font-semibold text-primary-tonal">
                View all ›
              </Text>
            </Pressable>
          </View>

          <ExploreSongCard
            song={FEATURED_SONG}
            onPress={playFeatured}
            onPlayPress={playFeatured}
          />
        </View>

        <RisingCreatorCard
          creator={RISING_CREATOR}
          onPress={() => guard(() => push(`/artist/${RISING_CREATOR.id}`))}
          onSamplePress={playRisingSample}
          onFollowPress={() => guard(() => push(`/artist/${RISING_CREATOR.id}`))}
        />

        <TrendingSection
          title="Trending Now"
          onTrackPress={(track) =>
            play({
              id: `explore-trending-${track.id}`,
              title: track.title,
              artist: track.artist,
              coverUrl: track.coverUrl,
            })
          }
        />

        <FeaturedArtistsSection
          title="Top Creators"
          subtitle="Trendsetters & Sound Designers"
          actionLabel="Explore All"
          onArtistPress={(artist) => guard(() => push(`/artist/${artist.id}`))}
        />

        <ChallengeCard
          statusLabel="Active Community Challenge"
          title="Remix Roulette: Neo-Soul"
          description="Sample Maya Lin's raw studio vocal stems, flip the groove, and earn peer votes from the VibeOGram creator community."
          endsIn="Ends in 3d 12h"
          prizeLabel="Prize Pool"
          prize="$1,500 Studio Grant & Official Release"
          primaryActionLabel="Join & Download Stems"
          secondaryAction="share"
        />

        <TrendingSection
          title="Top Songs"
          subtitle="Most played & remixed this week"
          actionLabel="Full Chart"
          onTrackPress={(track) =>
            play({
              id: `explore-top-${track.id}`,
              title: track.title,
              artist: track.artist,
              coverUrl: track.coverUrl,
            })
          }
        />

        <CuratedPlaylistsSection
          subtitle="Handpicked for creative flow"
          actionLabel="See All"
        />
      </ScrollView>
    </View>
  );
}
