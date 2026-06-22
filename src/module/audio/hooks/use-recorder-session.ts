import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

import type { AudioSessionContextValue } from '@/module/audio/context/audio-session-context';
import {
  discardPreviewRecording,
  stagePreviewRecording,
} from '@/module/audio/data/recording-repository';
import type { RecorderStatus } from '@/module/audio/types/recorder';

const RECORDING_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
  directory: 'document' as const,
};

const METERING_BAR_COUNT = 20;

function normalizeMetering(metering?: number): number {
  if (metering == null) return 0.15;
  const clamped = Math.max(-60, Math.min(0, metering));
  return (clamped + 60) / 60;
}

export function useRecorderSession(): AudioSessionContextValue {
  const audioRecorder = useAudioRecorder(RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(audioRecorder, 100);

  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [meteringBars, setMeteringBars] = useState<number[]>(
    () => Array(METERING_BAR_COUNT).fill(0.15),
  );
  const frozenDurationRef = useRef(0);

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission required', 'Microphone access is needed to record audio.');
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();
  }, []);

  useEffect(() => {
    if (!hasActiveSession || isPaused) return;

    setMeteringBars((prev) => {
      const next = [...prev.slice(1), normalizeMetering(recorderState.metering)];
      return next;
    });
  }, [hasActiveSession, isPaused, recorderState.metering]);

  const status: RecorderStatus = useMemo(() => {
    if (hasActiveSession) {
      return isPaused ? 'paused' : 'recording';
    }
    if (previewUri) return 'preview';
    return 'idle';
  }, [hasActiveSession, isPaused, previewUri]);

  const timerSeconds = useMemo(() => {
    if (hasActiveSession) {
      return Math.floor(recorderState.durationMillis / 1000);
    }
    if (previewUri) {
      return Math.floor(frozenDurationRef.current / 1000);
    }
    return 0;
  }, [hasActiveSession, previewUri, recorderState.durationMillis]);

  const startRecording = useCallback(async () => {
    if (previewUri) {
      await discardPreviewRecording(previewUri);
    }

    setPreviewUri(null);
    setIsPaused(false);
    setMeteringBars(Array(METERING_BAR_COUNT).fill(0.15));

    await audioRecorder.prepareToRecordAsync(RECORDING_OPTIONS);
    audioRecorder.record();
    setHasActiveSession(true);
  }, [audioRecorder, previewUri]);

  const pauseRecording = useCallback(() => {
    if (!hasActiveSession || isPaused) return;
    audioRecorder.pause();
    setIsPaused(true);
  }, [audioRecorder, hasActiveSession, isPaused]);

  const resumeRecording = useCallback(() => {
    if (!hasActiveSession || !isPaused) return;
    audioRecorder.record();
    setIsPaused(false);
  }, [audioRecorder, hasActiveSession, isPaused]);

  const stopRecording = useCallback(async () => {
    if (!hasActiveSession) return;

    frozenDurationRef.current = recorderState.durationMillis;
    await audioRecorder.stop();

    const uri = audioRecorder.uri;
    if (uri) {
      try {
        const stagedUri = await stagePreviewRecording(uri);
        setPreviewUri(stagedUri);
      } catch (error) {
        console.log('Error staging preview recording:', error);
        Alert.alert('Error', 'Could not prepare recording for preview.');
        setPreviewUri(null);
      }
    }

    setHasActiveSession(false);
    setIsPaused(false);
  }, [audioRecorder, hasActiveSession, recorderState.durationMillis]);

  const resetSession = useCallback(async () => {
    if (hasActiveSession) {
      try {
        await audioRecorder.stop();
      } catch {
        // Recorder may already be stopped.
      }
    }

    if (previewUri) {
      await discardPreviewRecording(previewUri);
    }

    setHasActiveSession(false);
    setIsPaused(false);
    setPreviewUri(null);
    frozenDurationRef.current = 0;
    setMeteringBars(Array(METERING_BAR_COUNT).fill(0.15));
  }, [audioRecorder, hasActiveSession, previewUri]);

  const handleMainAction = useCallback(async () => {
    if (hasActiveSession) {
      await stopRecording();
      return;
    }
    await startRecording();
  }, [hasActiveSession, startRecording, stopRecording]);

  const handlePauseResume = useCallback(() => {
    if (isPaused) {
      resumeRecording();
      return;
    }
    pauseRecording();
  }, [isPaused, pauseRecording, resumeRecording]);

  return {
    status,
    timerSeconds,
    meteringBars,
    previewUri,
    hasActiveSession,
    isPaused,
    handleMainAction,
    handlePauseResume,
    resetSession,
  };
}
