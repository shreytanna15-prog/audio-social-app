export type ProjectSummaryDto = {
  id: string;
  title: string;
  description: string | null;
  trackCount: number;
  updatedAt: string;
  createdAt: string;
};

export type ProjectTrackDto = {
  id: string;
  kind: 'SINGLE' | 'MULTI';
  status: 'DRAFT' | 'PUBLISHED';
  storageState: 'LOCAL_ONLY' | 'SYNCED' | 'CLOUD_ONLY';
  title: string;
  durationMs: number;
  mixUrl: string | null;
  addedAt: string;
  createdAt: string;
};

export type ProjectDetailDto = ProjectSummaryDto & {
  tracks: ProjectTrackDto[];
};

export type CreateProjectRequest = {
  title: string;
  description?: string | null;
};

export type UpdateProjectRequest = {
  title?: string;
  description?: string | null;
};

export type AttachProjectTracksRequest = {
  trackIds: string[];
};

export type AttachProjectTracksResponse = {
  attached: string[];
};

export type DeleteProjectResponse = {
  id: string;
  deletedTrackIds?: string[];
};

export type UnlinkProjectTrackResponse = {
  id: string;
  trackId: string;
};
