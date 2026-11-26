import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Pencil, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/core/api/errors';
import { ScreenHeader } from '@/shared/components/layout/screen-header';
import { ActionsDialog } from '@/shared/components/ui/actions-dialog';
import { Button } from '@/shared/components/ui/button';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';
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

import {
  useCreateProject,
  useDeleteProject,
  useProjects,
  useUpdateProject,
} from '../api/hooks';
import { CreateProjectCard } from '../components/create-project-card';
import { RecentProjectsList } from '../components/recent-projects-list';
import type { ProjectSummary } from '../types';
import { mapProjectSummary } from '../utils/map-project';

/**
 * Create (+) → Recent projects: create card + recent slice.
 * Full project list lives under Library → Projects.
 */
export function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const { push } = useRouter();
  const { guard } = useNavigationGuard();
  const { showError, dialog } = useFeedbackDialog();
  const projectsQuery = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<ProjectSummary | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [title, setTitle] = useState('');
  const [menuProject, setMenuProject] = useState<ProjectSummary | null>(null);
  const [deleteProjectTarget, setDeleteProjectTarget] =
    useState<ProjectSummary | null>(null);

  const projects = (projectsQuery.data ?? [])
    .slice(0, 5)
    .map(mapProjectSummary);

  const openProject = (project: ProjectSummary) => {
    guard(() => push({
      pathname: '/projects/[id]',
      params: { id: project.id, title: project.title },
    }));
  };

  const runDeleteProject = (project: ProjectSummary, deleteTracks: boolean) => {
    void deleteProject
      .mutateAsync({ id: project.id, deleteTracks })
      .then(() => setDeleteProjectTarget(null))
      .catch((error) => {
        showError(
          'Could not delete',
          getErrorMessage(error, 'Try again.'),
        );
      });
  };

  const submitRename = () => {
    if (!renameTarget) return;
    const trimmed = renameTitle.trim();
    if (!trimmed) {
      showError('Title required', 'Give your project a name.');
      return;
    }
    void updateProject
      .mutateAsync({ id: renameTarget.id, body: { title: trimmed } })
      .then(() => setRenameTarget(null))
      .catch((error) => {
        showError('Could not rename project', getErrorMessage(error, 'Try again.'));
      });
  };

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
        guard(() => push({
          pathname: '/projects/[id]',
          params: { id: created.id, title: created.title },
        }));
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
            onProjectPress={openProject}
            onMorePress={setMenuProject}
          />
        )}
      </View>

      <ActionsDialog
        open={menuProject != null}
        onOpenChange={(open) => {
          if (!open) setMenuProject(null);
        }}
        variant="menu"
        title={menuProject?.title ?? ''}
        actions={[
          {
            key: 'rename',
            label: 'Rename project',
            icon: Pencil,
            onPress: () => {
              if (!menuProject) return;
              const project = menuProject;
              setMenuProject(null);
              setRenameTitle(project.title);
              setRenameTarget(project);
            },
          },
        ]}
        destructiveAction={{
          label: 'Delete project',
          icon: Trash2,
          onPress: () => {
            if (!menuProject) return;
            const project = menuProject;
            setMenuProject(null);
            setDeleteProjectTarget(project);
          },
        }}
      />

      <ActionsDialog
        open={deleteProjectTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteProjectTarget(null);
        }}
        variant="confirm"
        title="Delete project?"
        message="Keep the tracks in your library, or delete the tracks too."
        busy={deleteProject.isPending}
        actions={[
          {
            key: 'keep',
            label: deleteProject.isPending ? 'Deleting…' : 'Keep tracks',
            onPress: () => {
              if (!deleteProjectTarget) return;
              runDeleteProject(deleteProjectTarget, false);
            },
          },
          {
            key: 'delete-tracks',
            label: 'Delete tracks too',
            variant: 'destructive',
            onPress: () => {
              if (!deleteProjectTarget) return;
              runDeleteProject(deleteProjectTarget, true);
            },
          },
        ]}
      />

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

      <Dialog
        open={renameTarget != null}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}>
        <DialogContent dismissOnBackdropPress={!updateProject.isPending}>
          <DialogHeader>
            <DialogTitle>Rename project</DialogTitle>
          </DialogHeader>
          <Input
            value={renameTitle}
            onChangeText={setRenameTitle}
            placeholder="Project title"
            autoFocus
            maxLength={100}
            editable={!updateProject.isPending}
            returnKeyType="done"
            onSubmitEditing={submitRename}
          />
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              disabled={updateProject.isPending}
              onPress={() => setRenameTarget(null)}>
              <Text>Cancel</Text>
            </Button>
            <Button
              variant="soft"
              size="sm"
              disabled={updateProject.isPending}
              onPress={submitRename}>
              <Text>{updateProject.isPending ? 'Saving…' : 'Save'}</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {dialog}
    </View>
  );
}
