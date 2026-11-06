import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  attachProjectTracks,
  createProject,
  deleteProject,
  getProject,
  listProjects,
  unlinkProjectTrack,
  updateProject,
} from './service';
import type {
  AttachProjectTracksRequest,
  CreateProjectRequest,
  UpdateProjectRequest,
} from './types';

export const PROJECTS_QUERY_KEY = ['projects'] as const;

export function useProjects() {
  return useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: listProjects,
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: [...PROJECTS_QUERY_KEY, id],
    queryFn: () => getProject(id!),
    enabled: typeof id === 'string' && id.length > 0,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateProjectRequest) => createProject(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; body: UpdateProjectRequest }) =>
      updateProject(input.id, input.body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; deleteTracks?: boolean }) =>
      deleteProject(input.id, input.deleteTracks ?? false),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
    },
  });
}

export function useAttachProjectTracks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; body: AttachProjectTracksRequest }) =>
      attachProjectTracks(input.id, input.body),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
      await queryClient.invalidateQueries({
        queryKey: [...PROJECTS_QUERY_KEY, variables.id],
      });
    },
  });
}

export function useUnlinkProjectTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { projectId: string; trackId: string }) =>
      unlinkProjectTrack(input.projectId, input.trackId),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
      await queryClient.invalidateQueries({
        queryKey: [...PROJECTS_QUERY_KEY, variables.projectId],
      });
    },
  });
}
