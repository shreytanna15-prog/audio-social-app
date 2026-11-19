import { create } from 'zustand';

import type { AudioProject } from '@/features/audio/types/project';
import type { TrackStorageState } from '@/features/tracks/types';

export type MultitrackPendingEntry = {
  project: AudioProject;
  trackId?: string | null;
  title?: string;
  storageState?: TrackStorageState | string | null;
};

type MultitrackEntryStore = {
  pending: MultitrackPendingEntry | null;
  setPendingProject: (project: AudioProject) => void;
  setPendingEntry: (entry: MultitrackPendingEntry) => void;
  /** Read-once handoff for Multitrack screen boot. */
  consumePendingEntry: () => MultitrackPendingEntry | null;
  /** @deprecated Prefer consumePendingEntry — kept for call sites that only need the project. */
  consumePendingProject: () => AudioProject | null;
  clearPendingProject: () => void;
};

export const useMultitrackEntryStore = create<MultitrackEntryStore>((set, get) => ({
  pending: null,
  setPendingProject: (project) => set({ pending: { project } }),
  setPendingEntry: (entry) => set({ pending: entry }),
  consumePendingEntry: () => {
    const pending = get().pending;
    if (pending) {
      set({ pending: null });
    }
    return pending;
  },
  consumePendingProject: () => {
    const pending = get().pending;
    if (pending) {
      set({ pending: null });
    }
    return pending?.project ?? null;
  },
  clearPendingProject: () => set({ pending: null }),
}));
