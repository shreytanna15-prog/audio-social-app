import { create } from 'zustand';

import {
  fromStoredEditChain,
  toStoredEditChain,
} from '@/features/audio/domain/edit-chain-persistence';
import {
  createEmptyProject,
  createLayer,
  nextLayerName,
  selectedLayer,
} from '@/features/audio/domain/project';
import {
  EMPTY_EDIT_CHAIN,
  type EditChainSelection,
  type StoredEditChain,
} from '@/features/audio/types/edit-chips';
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

export const DEFAULT_QUICK_RECORD_TITLE = 'Untitled take';

/** Capture FX never uses Clean Voice (soft SpectralGate is fixed post-stop). */
export function normalizeCaptureFxSelection(
  selection: EditChainSelection,
): EditChainSelection {
  return { ...selection, cleanVoice: false };
}

function captureFxFromProject(project: AudioProject): EditChainSelection {
  const layer = selectedLayer(project);
  return normalizeCaptureFxSelection(fromStoredEditChain(layer?.captureFx));
}

function withCaptureFxOnVocal(
  project: AudioProject,
  selection: EditChainSelection,
): AudioProject {
  const stored = toStoredEditChain(normalizeCaptureFxSelection(selection));
  const vocalId =
    project.selectedLayerId ??
    project.layers.find((layer) => layer.kind === 'vocal')?.id ??
    project.layers[0]?.id;

  if (!vocalId) {
    return project;
  }

  return {
    ...project,
    layers: project.layers.map((layer) =>
      layer.id === vocalId ? { ...layer, captureFx: stored } : layer,
    ),
  };
}

export function fingerprintQuickRecordProject(
  project: AudioProject,
  title: string = DEFAULT_QUICK_RECORD_TITLE,
): string {
  return JSON.stringify({
    title: title.trim() || DEFAULT_QUICK_RECORD_TITLE,
    selectedLayerId: project.selectedLayerId,
    layers: project.layers.map((layer) => ({
      id: layer.id,
      kind: layer.kind,
      stemUri: layer.stemUri,
      muted: layer.muted,
      editChain: layer.editChain ?? null,
      captureFx: layer.captureFx ?? null,
      durationSeconds: layer.durationSeconds,
      offsetMs: layer.offsetMs,
    })),
  });
}

type QuickRecordStore = {
  project: AudioProject;
  title: string;
  initialFingerprint: string;
  captureFxSelection: EditChainSelection;
  setProject: (project: AudioProject) => void;
  setTitle: (title: string) => void;
  setCaptureFxSelection: (selection: EditChainSelection) => void;
  hydrateFromImport: (project: AudioProject, title?: string) => void;
  applyStem: (
    layerId: string,
    stemUri: string,
    editChain?: StoredEditChain,
  ) => void;
  applyCaptureFxStem: (layerId: string, stemUri: string) => void;
  reset: () => void;
  hasTake: () => boolean;
};

export const useQuickRecordStore = create<QuickRecordStore>((set, get) => {
  const initial = createQuickRecordProject();
  return {
    project: initial,
    title: DEFAULT_QUICK_RECORD_TITLE,
    initialFingerprint: fingerprintQuickRecordProject(
      initial,
      DEFAULT_QUICK_RECORD_TITLE,
    ),
    captureFxSelection: EMPTY_EDIT_CHAIN,
    setProject: (project) => set({ project }),
    setTitle: (title) =>
      set({
        title: title.trim() || DEFAULT_QUICK_RECORD_TITLE,
      }),
    setCaptureFxSelection: (selection) => {
      const next = normalizeCaptureFxSelection(selection);
      const current = get();
      set({
        captureFxSelection: next,
        project: withCaptureFxOnVocal(current.project, next),
      });
    },
    hydrateFromImport: (project, title = DEFAULT_QUICK_RECORD_TITLE) => {
      const nextTitle = title.trim() || DEFAULT_QUICK_RECORD_TITLE;
      set({
        project,
        title: nextTitle,
        captureFxSelection: captureFxFromProject(project),
        initialFingerprint: fingerprintQuickRecordProject(project, nextTitle),
      });
    },
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
    applyCaptureFxStem: (layerId, stemUri) => {
      const current = get();
      const stored = toStoredEditChain(current.captureFxSelection);
      set({
        project: {
          ...current.project,
          layers: current.project.layers.map((layer) =>
            layer.id === layerId
              ? { ...layer, stemUri, captureFx: stored }
              : layer,
          ),
        },
      });
    },
    reset: () => {
      const next = createQuickRecordProject();
      set({
        project: next,
        title: DEFAULT_QUICK_RECORD_TITLE,
        captureFxSelection: EMPTY_EDIT_CHAIN,
        initialFingerprint: fingerprintQuickRecordProject(
          next,
          DEFAULT_QUICK_RECORD_TITLE,
        ),
      });
    },
    hasTake: () => Boolean(selectedLayer(get().project)?.stemUri),
  };
});
