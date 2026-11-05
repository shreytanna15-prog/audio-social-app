import type { ProjectDetail, ProjectSummary } from '../types';

/**
 * Full project catalog (Library → Projects).
 * Recent screen shows a sorted slice via {@link RECENT_PROJECTS}.
 */
export const ALL_PROJECTS: ProjectSummary[] = [
  {
    id: 'midnight-groove',
    title: 'Midnight Groove',
    audioItemCount: 4,
    updatedLabel: '2h ago',
  },
  {
    id: 'acoustic-sessions',
    title: 'Acoustic Sessions',
    audioItemCount: 6,
    updatedLabel: 'Yesterday',
  },
  {
    id: 'synthwave-explorations',
    title: 'Synthwave Explorations',
    audioItemCount: 2,
    updatedLabel: '3 days ago',
  },
  {
    id: 'vocal-hooks-stems',
    title: 'Vocal Hooks & Stems',
    audioItemCount: 8,
    updatedLabel: '1 week ago',
  },
  {
    id: 'late-night-beats',
    title: 'Late Night Beats',
    audioItemCount: 3,
    updatedLabel: '2 weeks ago',
  },
  {
    id: 'unfinished-demos',
    title: 'Unfinished Demos 2025',
    audioItemCount: 1,
    updatedLabel: '3 weeks ago',
  },
  {
    id: 'chorus-sketches',
    title: 'Chorus Sketches',
    audioItemCount: 5,
    updatedLabel: 'Oct 12',
  },
  {
    id: 'live-session-stems',
    title: 'Live Session Stems',
    audioItemCount: 7,
    updatedLabel: 'Oct 8',
  },
];

/** Create (+) → Recent projects — newest first slice of the shared catalog. */
export const RECENT_PROJECTS: ProjectSummary[] = ALL_PROJECTS.slice(0, 5);

const MIDNIGHT_GROOVE_DETAIL: ProjectDetail = {
  ...ALL_PROJECTS[0]!,
  statusLabel: 'In Progress',
  tracks: [
    {
      id: 'mg-1',
      title: 'Lead Vocal Take 03',
      kind: 'single',
      metaLabel: '1:42 · 2h ago',
    },
    {
      id: 'mg-2',
      title: 'Midnight Groove Mix',
      kind: 'multitrack',
      metaLabel: '4 Layers · Yesterday',
    },
    {
      id: 'mg-3',
      title: 'Harmony Take — Bridge',
      kind: 'single',
      metaLabel: '0:48 · 3d ago',
    },
    {
      id: 'mg-4',
      title: 'Backing Instrumental — 120 BPM',
      kind: 'import',
      metaLabel: '2:30 · 4d ago',
    },
  ],
};

function buildDetailFromSummary(summary: ProjectSummary): ProjectDetail {
  if (summary.id === MIDNIGHT_GROOVE_DETAIL.id) {
    return MIDNIGHT_GROOVE_DETAIL;
  }

  return {
    ...summary,
    statusLabel: 'In Progress',
    tracks: [
      {
        id: `${summary.id}-1`,
        title: 'Vocal Take 01',
        kind: 'single',
        metaLabel: `1:20 · ${summary.updatedLabel}`,
      },
      {
        id: `${summary.id}-2`,
        title: `${summary.title} Mix`,
        kind: 'multitrack',
        metaLabel: `3 Layers · ${summary.updatedLabel}`,
      },
    ],
  };
}

const DETAILS_BY_ID = new Map(
  ALL_PROJECTS.map((project) => [project.id, buildDetailFromSummary(project)]),
);

export function getProjectDetailFixture(id: string | undefined): ProjectDetail {
  if (id && DETAILS_BY_ID.has(id)) {
    return DETAILS_BY_ID.get(id)!;
  }
  return MIDNIGHT_GROOVE_DETAIL;
}
