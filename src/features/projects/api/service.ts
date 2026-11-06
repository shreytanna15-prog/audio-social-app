import { apiRequest } from '@/core/api';

import type {
  AttachProjectTracksRequest,
  AttachProjectTracksResponse,
  CreateProjectRequest,
  DeleteProjectResponse,
  ProjectDetailDto,
  ProjectSummaryDto,
  UnlinkProjectTrackResponse,
  UpdateProjectRequest,
} from './types';

export async function listProjects(): Promise<ProjectSummaryDto[]> {
  return apiRequest<ProjectSummaryDto[]>({
    path: '/api/projects',
    method: 'GET',
  });
}

export async function getProject(id: string): Promise<ProjectDetailDto> {
  return apiRequest<ProjectDetailDto>({
    path: `/api/projects/${id}`,
    method: 'GET',
  });
}

export async function createProject(
  body: CreateProjectRequest,
): Promise<ProjectSummaryDto> {
  return apiRequest<ProjectSummaryDto>({
    path: '/api/projects',
    method: 'POST',
    body,
  });
}

export async function updateProject(
  id: string,
  body: UpdateProjectRequest,
): Promise<ProjectSummaryDto> {
  return apiRequest<ProjectSummaryDto>({
    path: `/api/projects/${id}`,
    method: 'PATCH',
    body,
  });
}

export async function deleteProject(
  id: string,
  deleteTracks = false,
): Promise<DeleteProjectResponse> {
  const query = `?deleteTracks=${deleteTracks ? 'true' : 'false'}`;
  return apiRequest<DeleteProjectResponse>({
    path: `/api/projects/${id}${query}`,
    method: 'DELETE',
  });
}

export async function attachProjectTracks(
  id: string,
  body: AttachProjectTracksRequest,
): Promise<AttachProjectTracksResponse> {
  return apiRequest<AttachProjectTracksResponse>({
    path: `/api/projects/${id}/tracks`,
    method: 'POST',
    body,
  });
}

export async function unlinkProjectTrack(
  projectId: string,
  trackId: string,
): Promise<UnlinkProjectTrackResponse> {
  return apiRequest<UnlinkProjectTrackResponse>({
    path: `/api/projects/${projectId}/tracks/${trackId}`,
    method: 'DELETE',
  });
}
