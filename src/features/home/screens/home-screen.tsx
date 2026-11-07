import { type Href, useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { usePlayerStore } from '@/features/player';
import { useMe } from '@/features/profile/api/hooks';
import { AppHeader } from '@/shared/components/layout/app-header';
import {
  ChallengeCard,
  CuratedPlaylistsSection,
  FeaturedArtistsSection,
  TrendingSection,
} from '@/shared/components/music';

import { HomeGreetingRow } from '../components/home-greeting-row';
import { MadeForYourVibeSection } from '../components/made-for-your-vibe-section';
import { ProjectCard } from '../components/project-card';
import { RecentlyPlayedSection } from '../components/recently-played-section';

export function HomeScreen() {
  const { push } = useRouter();
  const play = usePlayerStore((s) => s.play);
  const { data: me } = useMe();
  const greetingName = me?.name?.trim() || me?.username;

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        showNotificationBadge
        onNotificationsPress={() => push('/notifications' as Href)}
        onChatPress={() => push('/(tabs)/chat' as Href)}
        onAvatarPress={() => push('/(tabs)/profile' as Href)}
      />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 pb-8 pt-4"
        showsVerticalScrollIndicator={false}>
        <HomeGreetingRow name={greetingName} />
        <ProjectCard onOpenPress={() => push('/projects/' as Href)} />
        <FeaturedArtistsSection
          onArtistPress={(artist) => push(`/artist/${artist.id}`)}
        />
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
        <CuratedPlaylistsSection actionLabel="Explore" />
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
