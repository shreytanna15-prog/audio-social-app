import { create } from 'zustand';

import type { AudioProject } from '@/features/audio/types/project';

export type MultitrackPendingEntry = {
  project: AudioProject;
  trackId?: string | null;
  title?: string | null;
};

type MultitrackEntryStore = {
  pending: MultitrackPendingEntry | null;
  setPendingProject: (
    project: AudioProject,
    options?: { trackId?: string | null; title?: string | null },
  ) => void;
  consumePendingProject: () => MultitrackPendingEntry | null;
  clearPendingProject: () => void;
};

export const useMultitrackEntryStore = create<MultitrackEntryStore>((set, get) => ({
  pending: null,
  setPendingProject: (project, options) =>
    set({
      pending: {
        project,
        trackId: options?.trackId ?? null,
        title: options?.title ?? null,
      },
    }),
  consumePendingProject: () => {
    const pending = get().pending;
    if (pending) {
      set({ pending: null });
    }
    return pending;
  },
  clearPendingProject: () => set({ pending: null }),
}));
