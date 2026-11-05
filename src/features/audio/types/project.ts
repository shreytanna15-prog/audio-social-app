import type { StoredEditChain } from '@/features/audio/types/edit-chips';
import type {
  AppliedEffect,
  TrackKind,
  TrackStatus,
} from '@/features/tracks/types';

export const PROJECT_VERSION = 2;
export const MAX_PROJECT_LAYERS = 5;

export type ProjectLayerKind = 'vocal' | 'beat' | 'import';

export type ProjectLayer = {
  id: string;
  kind: ProjectLayerKind;
  name: string;
  stemUri: string | null;
  baselineUri?: string | null;
  sourceUri?: string | null;
  editChain?: StoredEditChain;
  captureFx?: StoredEditChain;
  muted: boolean;
  offsetMs: number;
  durationSeconds: number;
  peaks: number[];
};

export type AudioProject = {
  version: typeof PROJECT_VERSION | 1;
  layers: ProjectLayer[];
  selectedLayerId: string | null;
};

/** On-disk layer: TrackLayerRecord fields + local editor extras. */
export type StoredProjectLayer = {
  id: string;
  sortIndex: number;
  kind: ProjectLayerKind;
  name: string;
  stemPath: string | null;
  sourcePath: string | null;
  offsetMs: number;
  durationMs: number;
  muted: boolean;
  appliedEffects: AppliedEffect[];
  peaks: number[] | null;
  createdAt: string;
  updatedAt: string;
  baselinePath?: string | null;
  editChain?: StoredEditChain;
  captureFx?: StoredEditChain;
  durationSeconds?: number;
};

/** On-disk project.json: TrackDocument-shaped + selectedLayerId. */
export type StoredAudioProject = {
  version: typeof PROJECT_VERSION | 1;
  id?: string;
  kind?: TrackKind;
  status?: TrackStatus;
  title?: string;
  durationMs?: number;
  mixPath?: string;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  selectedLayerId: string | null;
  layers: StoredProjectLayer[];
};
