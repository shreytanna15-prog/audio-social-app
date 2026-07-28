import { useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useEffect } from 'react';

import { RECORDING_OPTIONS, recorderService } from '@/features/audio/services/recorder.service';
import { expoPcmCaptureService } from '@/features/audio/services/expo-pcm-capture.service';
import { useAudioSessionStore } from '@/features/audio/store/audio-session.store';

const CAPTURE_TICK_MS = 100;

export function useAudioRecorderBinding(): void {
  const audioRecorder = useAudioRecorder(RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(audioRecorder, CAPTURE_TICK_MS);

  const initialize = useAudioSessionStore((state) => state.initialize);
  const syncRecorderState = useAudioSessionStore((state) => state.syncRecorderState);
  const hasActiveSession = useAudioSessionStore((state) => state.hasActiveSession);

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
    if (!hasActiveSession) {
      syncRecorderState(recorderState);
      return;
    }

    const interval = setInterval(() => {
      const tick = expoPcmCaptureService.getTick();
      syncRecorderState({
        metering: tick.metering,
        durationMillis: tick.durationMillis,
      });
    }, CAPTURE_TICK_MS);

    return () => {
      clearInterval(interval);
    };
  }, [hasActiveSession, recorderState, syncRecorderState]);
}
