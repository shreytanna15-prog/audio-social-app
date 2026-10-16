import type { StoredEditChain } from '@/features/audio/types/edit-chips';

export const PROJECT_VERSION = 1;
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
  muted: boolean;
  offsetMs: number;
  durationSeconds: number;
  peaks: number[];
};

export type AudioProject = {
  version: typeof PROJECT_VERSION;
  layers: ProjectLayer[];
  selectedLayerId: string | null;
};

/** On-disk layer (relative paths under the document directory). */
export type StoredProjectLayer = {
  id: string;
  kind: ProjectLayerKind;
  name: string;
  stemPath: string | null;
  baselinePath?: string | null;
  sourcePath?: string | null;
  editChain?: StoredEditChain;
  muted: boolean;
  offsetMs: number;
  durationSeconds: number;
  peaks: number[];
};

export type StoredAudioProject = {
  version: typeof PROJECT_VERSION;
  selectedLayerId: string | null;
  layers: StoredProjectLayer[];
};
