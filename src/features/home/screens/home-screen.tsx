import { ScrollView, View } from 'react-native';

import { usePlayerStore } from '@/features/player';
import { AppHeader } from '@/shared/components/layout/app-header';

import { ChallengeCard } from '../components/challenge-card';
import { CuratedPlaylistsSection } from '../components/curated-playlists-section';
import { FeaturedArtistsSection } from '../components/featured-artists-section';
import { HomeGreetingRow } from '../components/home-greeting-row';
import { MadeForYourVibeSection } from '../components/made-for-your-vibe-section';
import { ProjectCard } from '../components/project-card';
import { RecentlyPlayedSection } from '../components/recently-played-section';
import { TrendingSection } from '../components/trending-section';

export function HomeScreen() {
  const play = usePlayerStore((s) => s.play);

  return (
    <View className="flex-1 bg-background">
      <AppHeader showNotificationBadge />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 pb-8 pt-4"
        showsVerticalScrollIndicator={false}>
        <HomeGreetingRow />
        <ProjectCard />
        <FeaturedArtistsSection />
        <MadeForYourVibeSection
          onTrackPress={(track) =>
            play({
              id: `vibe-${track.id}`,
              title: track.title,
              artist: track.artist,
              coverUrl: track.coverUrl,
            })
          }
          onPlayPress={(track) =>
            play({
              id: `vibe-${track.id}`,
              title: track.title,
              artist: track.artist,
              coverUrl: track.coverUrl,
            })
          }
        />
        <TrendingSection
          onTrackPress={(track) =>
            play({
              id: `trending-${track.id}`,
              title: track.title,
              artist: track.artist,
              coverUrl: track.coverUrl,
            })
          }
        />
        <CuratedPlaylistsSection />
        <ChallengeCard />
        <RecentlyPlayedSection
          onTrackPress={(track) =>
            play({
              id: `recent-${track.id}`,
              title: track.title,
              artist: track.artist,
              coverUrl: track.coverUrl,
            })
          }
        />
      </ScrollView>
    </View>
  );
}
