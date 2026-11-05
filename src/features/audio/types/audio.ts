import type { AppliedEffect } from '@/features/audio/types/applied-effects';
import type { StoredEditChain } from '@/features/audio/types/edit-chips';
import type { TrackRecord } from '@/features/tracks/types';

export type AudioRecording = Omit<TrackRecord, 'mixPath'> & {
  mixPath: string;
  uri: string;
  duration: number;
  /** @deprecated Prefer status. */
  type: 'draft' | 'uploaded';
  /** @deprecated Prefer mixPath. */
  path: string;
  projectPath?: string;
  sourcePath?: string;
  baselinePath?: string;
  editChain?: StoredEditChain;
  /** @deprecated Use editChain. */
  appliedEffects?: AppliedEffect[];
};
