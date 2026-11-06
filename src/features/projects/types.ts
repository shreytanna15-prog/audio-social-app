export type ProjectSummary = {
  id: string;
  title: string;
  description: string | null;
  trackCount: number;
  updatedAt: string;
  createdAt: string;
  updatedLabel: string;
};

export type ProjectTrackKind = 'SINGLE' | 'MULTI';

export type ProjectTrack = {
  id: string;
  kind: ProjectTrackKind;
  status: 'DRAFT' | 'PUBLISHED';
  storageState: 'LOCAL_ONLY' | 'SYNCED' | 'CLOUD_ONLY';
  title: string;
  durationMs: number;
  mixUrl: string | null;
  addedAt: string;
  createdAt: string;
  metaLabel: string;
};

export type ProjectDetail = ProjectSummary & {
  tracks: ProjectTrack[];
};
