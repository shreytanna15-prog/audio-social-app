import type { AppliedEffect } from '@/features/audio/types/applied-effects';
import type { StoredEditChain } from '@/features/audio/types/edit-chips';

export type AudioRecording = {
  id: string;
  uri: string;
  type: 'draft' | 'uploaded';
  duration: number;
  path: string;
  sourcePath?: string;
  /** Soft-gated baseline (pre user effects) for non-destructive re-edits. */
  baselinePath?: string;
  /** Full chip selection persisted on save. */
  editChain?: StoredEditChain;
  /** Multi-layer studio metadata. Absent on legacy single-take recordings. */
  projectPath?: string;
  /** @deprecated Legacy prototype effect metadata — use editChain. */
  appliedEffects?: AppliedEffect[];
  createdAt: string;
  updatedAt: string;
};