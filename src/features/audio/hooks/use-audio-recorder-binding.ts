import { useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useEffect } from 'react';

import { RECORDING_OPTIONS, recorderService } from '@/features/audio/services/recorder.service';
import { expoPcmCaptureService } from '@/features/audio/services/expo-pcm-capture.service';
import { nitroSoundCaptureService } from '@/features/audio/services/nitro-sound-capture.service';
import {
  recordingSessionService,
} from '@/features/audio/services/recording-session.service';
import { swmAudioCaptureService } from '@/features/audio/services/swm-audio-capture.service';
import { useAudioSessionStore } from '@/features/audio/store/audio-session.store';

const CAPTURE_TICK_MS = 100;

export function useAudioRecorderBinding(): void {
  const audioRecorder = useAudioRecorder(RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(audioRecorder, CAPTURE_TICK_MS);

  const initialize = useAudioSessionStore((state) => state.initialize);
  const syncRecorderState = useAudioSessionStore((state) => state.syncRecorderState);
  const hasActiveSession = useAudioSessionStore((state) => state.hasActiveSession);
  const recordingMode = useAudioSessionStore((state) => state.recordingMode);

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
    const backend = recordingSessionService.getActiveBackend();

    if (!hasActiveSession || backend === 'aac') {
      syncRecorderState(recorderState);
      return;
    }

    const interval = setInterval(() => {
      const tick =
        backend === 'swm-audio'
          ? swmAudioCaptureService.getTick()
          : backend === 'nitro-sound'
            ? nitroSoundCaptureService.getTick()
            : expoPcmCaptureService.getTick();

      syncRecorderState({
        metering: tick.metering,
        durationMillis: tick.durationMillis,
      });
    }, CAPTURE_TICK_MS);

    return () => {
      clearInterval(interval);
    };
  }, [
    hasActiveSession,
    recordingMode,
    recorderState,
    syncRecorderState,
  ]);
}
