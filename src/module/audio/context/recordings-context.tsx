import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { Alert } from 'react-native';

import { listRecordings, saveRecording as saveRecordingToStore } from '@/module/audio/data/recording-repository';
import type { AudioRecording } from '@/types/audio';

type SaveRecordingParams = {
  sourceUri: string;
  durationSeconds: number;
};

type RecordingsContextValue = {
  recordings: AudioRecording[];
  isLoading: boolean;
  isSaving: boolean;
  refreshRecordings: () => Promise<void>;
  saveRecording: (params: SaveRecordingParams) => Promise<AudioRecording | null>;
};

const RecordingsContext = createContext<RecordingsContextValue | null>(null);

export function RecordingsProvider({ children }: PropsWithChildren) {
  const [recordings, setRecordings] = useState<AudioRecording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const refreshRecordings = useCallback(async () => {
    setIsLoading(true);

    try {
      const nextRecordings = await listRecordings();
      setRecordings(nextRecordings);
    } catch {
      Alert.alert('Error', 'Could not load saved recordings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshRecordings();
  }, [refreshRecordings]);

  const saveRecording = useCallback(async (params: SaveRecordingParams) => {
    setIsSaving(true);

    try {
      const recording = await saveRecordingToStore(params);
      setRecordings((current) => [recording, ...current.filter((item) => item.id !== recording.id)]);
      return recording;
    } catch(error) {
      console.log("Error saving recording:", error);
      Alert.alert('Error', 'Could not save recording.');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      recordings,
      isLoading,
      isSaving,
      refreshRecordings,
      saveRecording,
    }),
    [recordings, isLoading, isSaving, refreshRecordings, saveRecording],
  );

  return <RecordingsContext.Provider value={value}>{children}</RecordingsContext.Provider>;
}

export function useRecordings(): RecordingsContextValue {
  const value = useContext(RecordingsContext);

  if (!value) {
    throw new Error('useRecordings must be used within a RecordingsProvider');
  }

  return value;
}
