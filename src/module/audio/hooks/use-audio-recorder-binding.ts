import { useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useEffect } from 'react';

import { RECORDING_OPTIONS, recorderService } from '@/module/audio/services/recorder.service';
import { useAudioSessionStore } from '@/store/audio-session.store';

export function useAudioRecorderBinding(): void {
  const audioRecorder = useAudioRecorder(RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(audioRecorder, 100);

  const initialize = useAudioSessionStore((state) => state.initialize);
  const syncRecorderState = useAudioSessionStore((state) => state.syncRecorderState);

  useEffect(() => {
    recorderService.bind(audioRecorder);

    return () => {
      recorderService.bind(null);
    };
  }, [audioRecorder]);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    syncRecorderState(recorderState);
  }, [recorderState, syncRecorderState]);
}
