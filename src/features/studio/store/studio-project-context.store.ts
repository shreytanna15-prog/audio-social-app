import { create } from 'zustand';

type StudioProjectContextStore = {
  projectId: string | null;
  setProjectId: (projectId: string | null) => void;
  /** Read-once handoff for studio save → createTrack projectId. */
  consumeProjectId: () => string | null;
  clearProjectId: () => void;
};

export const useStudioProjectContextStore = create<StudioProjectContextStore>(
  (set, get) => ({
    projectId: null,
    setProjectId: (projectId) => set({ projectId }),
    consumeProjectId: () => {
      const projectId = get().projectId;
      if (projectId) {
        set({ projectId: null });
      }
      return projectId;
    },
    clearProjectId: () => set({ projectId: null }),
  }),
);
