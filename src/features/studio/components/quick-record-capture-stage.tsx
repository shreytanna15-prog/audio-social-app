import { useEffect, useState } from 'react';
import { View } from 'react-native';
import {
  VoiceOrb,
  useVoiceAmplitude,
  type VoiceOrbState,
} from 'expo-thinking-orbs';

import { recordingSessionService } from '@/features/audio/services/recording-session.service';

const ORB_SIZE = 200;
/** Poll live capture tick — same source as the waveform meter. */
const METER_POLL_MS = 50;
/** dBFS: below this → calm idle shell while still "recording". */
const SILENCE_DB = -42;
const VOICE_DB = -38;

type QuickRecordCaptureStageProps = {
  isRecording: boolean;
  hasTake: boolean;
  isPlaying?: boolean;
  peaks: number[];
  progress?: number;
};

function levelFromPeaks(peaks: number[], progress: number): number {
  if (peaks.length === 0) return 0;
  const index = Math.min(
    peaks.length - 1,
    Math.max(0, Math.floor(progress * (peaks.length - 1))),
  );
  const a = peaks[Math.max(0, index - 1)] ?? 0;
  const b = peaks[index] ?? 0;
  const c = peaks[Math.min(peaks.length - 1, index + 1)] ?? 0;
  // Peaks are already ~0–1 display levels; take the hot sample, not a smear.
  return Math.max(0, Math.max(a, b, c));
}

/**
 * Capture stage: VoiceOrb driven by live mic dBFS (record) / peaks (playback).
 * Timeline punch-in stays in the card below.
 */
export function QuickRecordCaptureStage({
  isRecording,
  hasTake,
  isPlaying = false,
  peaks,
  progress = 0,
}: QuickRecordCaptureStageProps) {
  const mic = useVoiceAmplitude({ floorDb: -50, curve: 0.65 });
  const playback = useVoiceAmplitude();
  const [voiceActive, setVoiceActive] = useState(false);

  useEffect(() => {
    if (!isRecording) {
      mic.set(0);
      setVoiceActive(false);
      return;
    }

    const interval = setInterval(() => {
      const { metering } = recordingSessionService.getTick();
      const db =
        typeof metering === 'number' && Number.isFinite(metering)
          ? metering
          : -160;
      mic.setDb(db);
      setVoiceActive((prev) => {
        if (prev) return db > SILENCE_DB;
        return db > VOICE_DB;
      });
    }, METER_POLL_MS);

    return () => {
      clearInterval(interval);
      mic.set(0);
    };
  }, [isRecording, mic]);

  const playbackLevel = isPlaying ? levelFromPeaks(peaks, progress) : 0;

  useEffect(() => {
    if (!isPlaying) {
      playback.set(0);
      return;
    }
    playback.set(playbackLevel);
  }, [isPlaying, playback, playbackLevel]);

  // Stay in listening/speaking for the whole take so amplitude release
  // settles the shell — flipping to idle ignores level and snaps to rest.
  const state: VoiceOrbState = isRecording
    ? 'listening'
    : isPlaying
      ? 'speaking'
      : 'idle';

  const label = isRecording
    ? voiceActive
      ? 'Listening'
      : 'Waiting for voice'
    : isPlaying
      ? 'Playing take'
      : hasTake
        ? 'Take ready'
        : 'Ready to record';

  return (
    <View className="items-center justify-center py-2">
      <VoiceOrb
        state={state}
        size={ORB_SIZE}
        theme="dark"
        inputAmplitude={mic.level}
        outputAmplitude={playback.level}
        accessibilityLabel={label}
        color={isRecording ? '#EF5350' : '#D0BCFF'}
        colorTo={isRecording ? '#FFAB91' : '#FFB0CD'}
      />
    </View>
  );
}
