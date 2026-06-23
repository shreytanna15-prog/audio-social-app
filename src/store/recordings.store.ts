import { useMemo } from 'react';
import { Alert } from 'react-native';
import { create } from 'zustand';

import {
  deleteRecording as deleteRecordingFromRepository,
  listRecordings,
  saveRecording as saveRecordingToRepository,
  updateRecording as updateRecordingInRepository,
} from '@/module/audio/data/recording-repository';
import type { AudioEffectId } from '@/module/audio/types/effects';
import type { AudioRecording } from '@/types/audio';

export type SaveRecordingParams = {
  sourceUri: string;
  durationSeconds: number;
  appliedEffects?: AudioEffectId[];
};

export type UpdateRecordingParams = {
  id: string;
  sourceUri: string;
  durationSeconds: number;
  appliedEffects: AudioEffectId[];
};

export type RecordingsState = {
  recordings: AudioRecording[];
  isLoading: boolean;
  isSaving: boolean;
  refreshRecordings: () => Promise<void>;
  saveRecording: (params: SaveRecordingParams) => Promise<AudioRecording | null>;
  updateRecording: (params: UpdateRecordingParams) => Promise<AudioRecording | null>;
  deleteRecording: (id: string) => Promise<boolean>;
};

export const useRecordingsStore = create<RecordingsState>((set) => ({
  recordings: [],
  isLoading: true,
  isSaving: false,

  refreshRecordings: async () => {
    set({ isLoading: true });

    try {
      const nextRecordings = await listRecordings();
      set({ recordings: nextRecordings });
    } catch (error) {
      console.log('Error refreshing recordings:', error);
      Alert.alert('Error', 'Could not load saved recordings.');
    } finally {
      set({ isLoading: false });
    }
  },

  saveRecording: async (params) => {
    set({ isSaving: true });

    try {
      const recording = await saveRecordingToRepository(params);
      set((state) => ({
        recordings: [recording, ...state.recordings.filter((item) => item.id !== recording.id)],
      }));
      return recording;
    } catch (error) {
      console.log('Error saving recording:', error);
      Alert.alert('Error', 'Could not save recording.');
      return null;
    } finally {
      set({ isSaving: false });
    }
  },

  updateRecording: async (params) => {
    set({ isSaving: true });

    try {
      const recording = await updateRecordingInRepository(params);
      set((state) => ({
        recordings: state.recordings.map((item) => (item.id === recording.id ? recording : item)),
      }));
      return recording;
    } catch (error) {
      console.log('Error updating recording:', error);
      Alert.alert('Error', 'Could not save recording changes.');
      return null;
    } finally {
      set({ isSaving: false });
    }
  },

  deleteRecording: async (id) => {
    try {
      const deleted = await deleteRecordingFromRepository(id);

      if (deleted) {
        set((state) => ({
          recordings: state.recordings.filter((item) => item.id !== id),
        }));
      }

      return deleted;
    } catch (error) {
      console.log('Error deleting recording:', error);
      Alert.alert('Error', 'Could not delete recording.');
      return false;
    }
  },
}));

export function useRecordings(): RecordingsState {
  const recordings = useRecordingsStore((state) => state.recordings);
  const isLoading = useRecordingsStore((state) => state.isLoading);
  const isSaving = useRecordingsStore((state) => state.isSaving);
  const refreshRecordings = useRecordingsStore((state) => state.refreshRecordings);
  const saveRecording = useRecordingsStore((state) => state.saveRecording);
  const updateRecording = useRecordingsStore((state) => state.updateRecording);
  const deleteRecording = useRecordingsStore((state) => state.deleteRecording);

  return useMemo(
    () => ({
      recordings,
      isLoading,
      isSaving,
      refreshRecordings,
      saveRecording,
      updateRecording,
      deleteRecording,
    }),
    [recordings, isLoading, isSaving, refreshRecordings, saveRecording, updateRecording, deleteRecording],
  );
}
