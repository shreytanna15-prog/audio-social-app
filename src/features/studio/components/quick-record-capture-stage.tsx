import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { VoiceOrb, useVoiceAmplitude } from 'expo-thinking-orbs';

import { recordingSessionService } from '@/features/audio/services/recording-session.service';

const ORB_SIZE = 280;
const METER_POLL_MS = 50;
const AMPLITUDE_BOOST = 1.35;
const MIC_FLOOR_DB = -40;
const MIC_CURVE = 1;
const VOICE_DB = -36;
const SILENCE_DB = -42;
const ATTACK = 0.55;
const RELEASE = 0.16;

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
  return Math.max(0, Math.max(a, b, c));
}

function boostLevel(level01: number): number {
  if (!(level01 > 0)) return 0;
  return Math.min(1, level01 * AMPLITUDE_BOOST);
}

function levelFromDb(db: number): number {
  if (Number.isNaN(db) || db <= MIC_FLOOR_DB) return 0;
  const norm = (db - MIC_FLOOR_DB) / -MIC_FLOOR_DB;
  const clamped = norm < 0 ? 0 : norm > 1 ? 1 : norm;
  return boostLevel(clamped ** MIC_CURVE);
}

function followLevel(current: number, target: number): number {
  const coeff = target > current ? ATTACK : RELEASE;
  const next = current + (target - current) * coeff;
  return next < 0.004 ? 0 : next;
}

export function QuickRecordCaptureStage({
  isRecording,
  hasTake,
  isPlaying = false,
  peaks,
  progress = 0,
}: QuickRecordCaptureStageProps) {
  const level = useVoiceAmplitude({ floorDb: MIC_FLOOR_DB, curve: MIC_CURVE });
  const [voiceActive, setVoiceActive] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const levelRef = useRef(level);
  const displayRef = useRef(0);
  const peaksRef = useRef(peaks);
  const progressRef = useRef(progress);
  levelRef.current = level;
  peaksRef.current = peaks;
  progressRef.current = progress;

  const wantsMeterPreview = isFocused && !isRecording && !isPlaying;

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => {
        setIsFocused(false);
        recordingSessionService.stopMeterPreview();
        displayRef.current = 0;
        levelRef.current.set(0);
        setVoiceActive(false);
      };
    }, []),
  );

  useEffect(() => {
    if (!wantsMeterPreview) {
      recordingSessionService.stopMeterPreview();
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        await recordingSessionService.startMeterPreview();
      } catch (error) {
        console.warn('[QuickRecord] meter preview failed', error);
      }
      if (cancelled) {
        recordingSessionService.stopMeterPreview();
      }
    })();

    return () => {
      cancelled = true;
      recordingSessionService.stopMeterPreview();
    };
  }, [wantsMeterPreview]);

  useEffect(() => {
    const useMic = !isPlaying && (isRecording || wantsMeterPreview);
    if (!useMic && !isPlaying) {
      displayRef.current = 0;
      level.set(0);
      setVoiceActive(false);
      return;
    }

    const interval = setInterval(() => {
      let target = 0;
      let db = -160;

      if (isPlaying) {
        target = boostLevel(
          levelFromPeaks(peaksRef.current, progressRef.current),
        );
      } else {
        const tick = recordingSessionService.getTick();
        db =
          typeof tick.metering === 'number' && Number.isFinite(tick.metering)
            ? tick.metering
            : -160;
        target = levelFromDb(db);
      }

      const next = followLevel(displayRef.current, target);
      displayRef.current = next;
      level.set(next);

      if (!isPlaying) {
        setVoiceActive((prev) => {
          if (prev) return db > SILENCE_DB || next > 0.02;
          return db > VOICE_DB;
        });
      }
    }, METER_POLL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [isPlaying, isRecording, wantsMeterPreview, level]);

  const label = isRecording
    ? voiceActive
      ? 'Listening'
      : 'Waiting for voice'
    : isPlaying
      ? 'Playing take'
      : voiceActive
        ? 'Listening'
        : hasTake
          ? 'Take ready'
          : 'Ready to record';

  return (
    <View className="items-center justify-center py-2">
      <VoiceOrb
        state="speaking"
        size={ORB_SIZE}
        theme="dark"
        outputAmplitude={level.level}
        accessibilityLabel={label}
        color={isRecording ? '#EF5350' : '#D0BCFF'}
        colorTo={isRecording ? '#FFAB91' : '#FFB0CD'}
      />
    </View>
  );
}
