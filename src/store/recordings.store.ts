import { useMemo } from 'react';
import { Alert } from 'react-native';
import { create } from 'zustand';

import {
  listRecordings,
  saveRecording as saveRecordingToRepository,
} from '@/module/audio/data/recording-repository';
import type { AudioRecording } from '@/types/audio';

export type SaveRecordingParams = {
  sourceUri: string;
  durationSeconds: number;
};

export type RecordingsState = {
  recordings: AudioRecording[];
  isLoading: boolean;
  isSaving: boolean;
  refreshRecordings: () => Promise<void>;
  saveRecording: (params: SaveRecordingParams) => Promise<AudioRecording | null>;
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
}));

export function useRecordings(): RecordingsState {
  const recordings = useRecordingsStore((state) => state.recordings);
  const isLoading = useRecordingsStore((state) => state.isLoading);
  const isSaving = useRecordingsStore((state) => state.isSaving);
  const refreshRecordings = useRecordingsStore((state) => state.refreshRecordings);
  const saveRecording = useRecordingsStore((state) => state.saveRecording);

  return useMemo(
    () => ({
      recordings,
      isLoading,
      isSaving,
      refreshRecordings,
      saveRecording,
    }),
    [recordings, isLoading, isSaving, refreshRecordings, saveRecording],
  );
}
