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
import type {
  EditChainSelection,
  StoredEditChain,
} from '@/features/audio/types/edit-chips';
import type { AudioProject } from '@/features/audio/types/project';
import {
  readCaptureFxPrefs,
  rememberCaptureFxSelection,
} from '@/features/studio/store/capture-fx-prefs.store';

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

function captureFxFromProject(project: AudioProject): EditChainSelection {
  const layer = selectedLayer(project);
  if (layer?.captureFx || layer?.editChain) {
    return fromStoredEditChain(layer.captureFx ?? layer.editChain);
  }
  return readCaptureFxPrefs();
}

function withCaptureFxOnVocal(
  project: AudioProject,
  selection: EditChainSelection,
): AudioProject {
  const stored = toStoredEditChain(selection);
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
  trackId: string | null;
  initialFingerprint: string;
  captureFxSelection: EditChainSelection;
  setProject: (project: AudioProject) => void;
  setTitle: (title: string) => void;
  setTrackId: (trackId: string | null) => void;
  setCaptureFxSelection: (selection: EditChainSelection) => void;
  hydrateCaptureFxFromPrefs: () => void;
  hydrateFromImport: (
    project: AudioProject,
    title?: string,
    trackId?: string | null,
  ) => void;
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
  const initialFx = readCaptureFxPrefs();
  const initialWithFx = withCaptureFxOnVocal(initial, initialFx);
  return {
    project: initialWithFx,
    title: DEFAULT_QUICK_RECORD_TITLE,
    trackId: null,
    initialFingerprint: fingerprintQuickRecordProject(
      initialWithFx,
      DEFAULT_QUICK_RECORD_TITLE,
    ),
    captureFxSelection: initialFx,
    setProject: (project) => set({ project }),
    setTitle: (title) =>
      set({
        title: title.trim() || DEFAULT_QUICK_RECORD_TITLE,
      }),
    setTrackId: (trackId) =>
      set({
        trackId: trackId?.trim() ? trackId.trim() : null,
      }),
    setCaptureFxSelection: (selection) => {
      rememberCaptureFxSelection(selection);
      const current = get();
      set({
        captureFxSelection: selection,
        project: withCaptureFxOnVocal(current.project, selection),
      });
    },
    hydrateCaptureFxFromPrefs: () => {
      const selection = readCaptureFxPrefs();
      const current = get();
      const project = withCaptureFxOnVocal(current.project, selection);
      const empty = !selectedLayer(project)?.stemUri;
      set({
        captureFxSelection: selection,
        project,
        ...(empty
          ? {
              initialFingerprint: fingerprintQuickRecordProject(
                project,
                current.title,
              ),
            }
          : {}),
      });
    },
    hydrateFromImport: (
      project,
      title = DEFAULT_QUICK_RECORD_TITLE,
      trackId = null,
    ) => {
      const nextTitle = title.trim() || DEFAULT_QUICK_RECORD_TITLE;
      const selection = captureFxFromProject(project);
      rememberCaptureFxSelection(selection);
      const nextProject = withCaptureFxOnVocal(project, selection);
      set({
        project: nextProject,
        title: nextTitle,
        trackId: trackId?.trim() ? trackId.trim() : null,
        captureFxSelection: selection,
        initialFingerprint: fingerprintQuickRecordProject(nextProject, nextTitle),
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
      const prefs = readCaptureFxPrefs();
      const nextWithFx = withCaptureFxOnVocal(next, prefs);
      set({
        project: nextWithFx,
        title: DEFAULT_QUICK_RECORD_TITLE,
        trackId: null,
        captureFxSelection: prefs,
        initialFingerprint: fingerprintQuickRecordProject(
          nextWithFx,
          DEFAULT_QUICK_RECORD_TITLE,
        ),
      });
    },
    hasTake: () => Boolean(selectedLayer(get().project)?.stemUri),
  };
});
