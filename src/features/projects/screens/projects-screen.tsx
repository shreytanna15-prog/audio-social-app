import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/shared/components/layout/screen-header';

import { CreateProjectCard } from '../components/create-project-card';
import { RecentProjectsList } from '../components/recent-projects-list';
import { RECENT_PROJECTS } from '../data/projects.fixtures';

/**
 * Create (+) → Recent projects: create card + recent slice.
 * Full project list lives under Library → Projects.
 */
export function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const { push } = useRouter();

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Projects" />

      <View className="gap-5 pt-2">
        <CreateProjectCard />
      </View>

      <View className="mt-5 min-h-0 flex-1">
        <RecentProjectsList
          projects={RECENT_PROJECTS}
          contentBottomInset={Math.max(insets.bottom, 16) + 24}
          onProjectPress={(project) =>
            push({
              pathname: '/projects/[id]',
              params: { id: project.id, title: project.title },
            })
          }
        />
      </View>
    </View>
  );
}
