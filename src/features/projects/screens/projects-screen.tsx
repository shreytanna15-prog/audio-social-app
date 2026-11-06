import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/core/api/errors';
import { ScreenHeader } from '@/shared/components/layout/screen-header';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { useFeedbackDialog } from '@/shared/components/ui/feedback-dialog';
import { Input } from '@/shared/components/ui/input';
import { Text } from '@/shared/components/ui/text';

import { useCreateProject, useProjects } from '../api/hooks';
import { CreateProjectCard } from '../components/create-project-card';
import { RecentProjectsList } from '../components/recent-projects-list';
import { mapProjectSummary } from '../utils/map-project';

/**
 * Create (+) → Recent projects: create card + recent slice.
 * Full project list lives under Library → Projects.
 */
export function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const { push } = useRouter();
  const { showError, dialog } = useFeedbackDialog();
  const projectsQuery = useProjects();
  const createProject = useCreateProject();

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');

  const projects = (projectsQuery.data ?? [])
    .slice(0, 5)
    .map(mapProjectSummary);

  const submitCreate = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      showError('Title required', 'Give your project a name.');
      return;
    }

    void createProject
      .mutateAsync({ title: trimmed })
      .then((created) => {
        setCreateOpen(false);
        setTitle('');
        push({
          pathname: '/projects/[id]',
          params: { id: created.id, title: created.title },
        });
      })
      .catch((error) => {
        showError(
          'Could not create project',
          getErrorMessage(error, 'Try again.'),
        );
      });
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Projects" />

      <View className="gap-5 pt-2">
        <CreateProjectCard
          disabled={createProject.isPending}
          onPress={() => {
            setTitle('');
            setCreateOpen(true);
          }}
        />
      </View>

      <View className="mt-5 min-h-0 flex-1">
        {projectsQuery.isLoading && projects.length === 0 ? (
          <View className="items-center py-16">
            <ActivityIndicator color="#D0BCFF" />
          </View>
        ) : projectsQuery.isError && projects.length === 0 ? (
          <View className="items-center gap-3 px-8 py-16">
            <Text variant="title-md" className="text-on-surface">
              Couldn’t load projects
            </Text>
            <Text
              variant="body-md"
              className="text-primary"
              onPress={() => void projectsQuery.refetch()}>
              Retry
            </Text>
          </View>
        ) : (
          <RecentProjectsList
            projects={projects}
            contentBottomInset={Math.max(insets.bottom, 16) + 24}
            onProjectPress={(project) =>
              push({
                pathname: '/projects/[id]',
                params: { id: project.id, title: project.title },
              })
            }
          />
        )}
      </View>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent dismissOnBackdropPress={!createProject.isPending}>
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
          </DialogHeader>
          <Input
            value={title}
            onChangeText={setTitle}
            placeholder="Project title"
            autoFocus
            maxLength={100}
            editable={!createProject.isPending}
            returnKeyType="done"
            onSubmitEditing={submitCreate}
          />
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              disabled={createProject.isPending}
              onPress={() => setCreateOpen(false)}>
              <Text>Cancel</Text>
            </Button>
            <Button
              variant="soft"
              size="sm"
              disabled={createProject.isPending}
              onPress={submitCreate}>
              <Text>{createProject.isPending ? 'Creating…' : 'Create'}</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {dialog}
    </View>
  );
}
