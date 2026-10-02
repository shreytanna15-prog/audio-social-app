import { ScrollView, View } from 'react-native';

import { AppHeader } from '@/shared/components/layout/app-header';

import { FeaturedArtistsSection } from '../components/featured-artists-section';
import { HomeGreetingRow } from '../components/home-greeting-row';
import { ProjectCard } from '../components/project-card';

export function HomeScreen() {
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
      </ScrollView>
    </View>
  );
}
