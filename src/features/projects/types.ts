export type ProjectSummary = {
  id: string;
  title: string;
  audioItemCount: number;
  updatedLabel: string;
};

export type ProjectTrackKind = 'single' | 'multitrack' | 'import';

export type ProjectTrack = {
  id: string;
  title: string;
  kind: ProjectTrackKind;
  metaLabel: string;
};

export type ProjectDetail = ProjectSummary & {
  statusLabel: string;
  tracks: ProjectTrack[];
};
