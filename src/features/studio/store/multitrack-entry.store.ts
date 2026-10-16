import { create } from 'zustand';

import type { AudioProject } from '@/features/audio/types/project';

type MultitrackEntryStore = {
  pendingProject: AudioProject | null;
  setPendingProject: (project: AudioProject) => void;
  /** Read-once handoff for Multitrack screen boot. */
  consumePendingProject: () => AudioProject | null;
  clearPendingProject: () => void;
};

export const useMultitrackEntryStore = create<MultitrackEntryStore>((set, get) => ({
  pendingProject: null,
  setPendingProject: (project) => set({ pendingProject: project }),
  consumePendingProject: () => {
    const pending = get().pendingProject;
    if (pending) {
      set({ pendingProject: null });
    }
    return pending;
  },
  clearPendingProject: () => set({ pendingProject: null }),
}));
