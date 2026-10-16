import { create } from 'zustand';

import {
  createEmptyProject,
  createLayer,
  nextLayerName,
  selectedLayer,
} from '@/features/audio/domain/project';
import type { StoredEditChain } from '@/features/audio/types/edit-chips';
import type { AudioProject } from '@/features/audio/types/project';

function createQuickRecordProject(): AudioProject {
  const layer = createLayer({
    kind: 'vocal',
    name: nextLayerName([], 'vocal'),
  });
  return {
    ...createEmptyProject(),
    layers: [layer],
    selectedLayerId: layer.id,
  };
}

export function fingerprintQuickRecordProject(project: AudioProject): string {
  return JSON.stringify({
    selectedLayerId: project.selectedLayerId,
    layers: project.layers.map((layer) => ({
      id: layer.id,
      kind: layer.kind,
      stemUri: layer.stemUri,
      muted: layer.muted,
      editChain: layer.editChain ?? null,
      durationSeconds: layer.durationSeconds,
      offsetMs: layer.offsetMs,
    })),
  });
}

type QuickRecordStore = {
  project: AudioProject;
  initialFingerprint: string;
  setProject: (project: AudioProject) => void;
  applyStem: (
    layerId: string,
    stemUri: string,
    editChain?: StoredEditChain,
  ) => void;
  reset: () => void;
  hasTake: () => boolean;
};

export const useQuickRecordStore = create<QuickRecordStore>((set, get) => {
  const initial = createQuickRecordProject();
  return {
    project: initial,
    initialFingerprint: fingerprintQuickRecordProject(initial),
    setProject: (project) => set({ project }),
    applyStem: (layerId, stemUri, editChain) => {
      const current = get().project;
      set({
        project: {
          ...current,
          layers: current.layers.map((layer) =>
            layer.id === layerId ? { ...layer, stemUri, editChain } : layer,
          ),
        },
      });
    },
    reset: () => {
      const next = createQuickRecordProject();
      set({
        project: next,
        initialFingerprint: fingerprintQuickRecordProject(next),
      });
    },
    hasTake: () => Boolean(selectedLayer(get().project)?.stemUri),
  };
});
