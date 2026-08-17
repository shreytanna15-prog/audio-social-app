import { Alert } from 'react-native';
import { create } from 'zustand';

import {
  deleteRecording as deleteRecordingFromRepository,
  listRecordings,
  saveRecording as saveRecordingToRepository,
  updateRecording as updateRecordingInRepository,
} from '@/features/audio/data/recording-repository';
import type { StoredEditChain } from '@/features/audio/types/edit-chips';
import type { AudioRecording } from '@/features/audio/types/audio';

export type SaveRecordingParams = {
  sourceUri: string;
  baselineUri: string;
  durationSeconds: number;
  editChain?: StoredEditChain;
  sourcePreGateUri?: string | null;
};

export type UpdateRecordingParams = {
  id: string;
  sourceUri: string;
  baselineUri: string;
  durationSeconds: number;
  editChain?: StoredEditChain;
  sourcePreGateUri?: string | null;
};

export type RecordingsState = {
  recordings: AudioRecording[];
  isLoading: boolean;
  isSaving: boolean;
  refreshRecordings: () => Promise<void>;
  saveRecording: (params: SaveRecordingParams) => Promise<AudioRecording | null>;
  updateRecording: (params: UpdateRecordingParams) => Promise<AudioRecording | null>;
  /**
   * Background save used by the editor after every applied chip. Keeps the
   * temporary working file and stays out of `isSaving` so the UI does not flicker.
   */
  persistRecordingEdits: (params: UpdateRecordingParams) => Promise<AudioRecording | null>;
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

  persistRecordingEdits: async (params) => {
    try {
      const recording = await updateRecordingInRepository({
        ...params,
        keepSourceFile: true,
      });
      set((state) => ({
        recordings: state.recordings.map((item) =>
          item.id === recording.id ? recording : item,
        ),
      }));
      return recording;
    } catch (error) {
      console.log('Error auto-saving recording edits:', error);
      return null;
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
