import { useCallback, useEffect, useState } from 'react';

import {
  tanpuraConfigure,
  tanpuraDispose,
  tanpuraPlay,
  tanpuraStop,
} from '../services/tanpura-engine';
import { useTanpuraStore } from '../store/tanpura.store';
import type {
  TanpuraLabelMode,
  TanpuraPitchId,
  TanpuraPresetId,
} from '../types';

type UseTanpuraControllerOptions = {
  isRecording: boolean;
};

export function useTanpuraController({
  isRecording,
}: UseTanpuraControllerOptions) {
  const pitchId = useTanpuraStore((s) => s.pitchId);
  const presetId = useTanpuraStore((s) => s.presetId);
  const volume = useTanpuraStore((s) => s.volume);
  const speed = useTanpuraStore((s) => s.speed);
  const fineSemis = useTanpuraStore((s) => s.fineSemis);
  const labelMode = useTanpuraStore((s) => s.labelMode);
  const setPitchIdStore = useTanpuraStore((s) => s.setPitchId);
  const setPresetIdStore = useTanpuraStore((s) => s.setPresetId);
  const setVolumeStore = useTanpuraStore((s) => s.setVolume);
  const setSpeedStore = useTanpuraStore((s) => s.setSpeed);
  const nudgeFineSemisStore = useTanpuraStore((s) => s.nudgeFineSemis);
  const setLabelModeStore = useTanpuraStore((s) => s.setLabelMode);

  const [isPlaying, setIsPlaying] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const stop = useCallback(() => {
    tanpuraStop();
    setIsPlaying(false);
  }, []);

  const play = useCallback(() => {
    if (isRecording) return;
    tanpuraPlay({
      presetId,
      pitchId,
      volume,
      speed,
      fineSemis,
    });
    setIsPlaying(true);
  }, [fineSemis, isRecording, pitchId, presetId, speed, volume]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
      return;
    }
    play();
  }, [isPlaying, play, stop]);

  useEffect(() => {
    if (!isPlaying) return;
    tanpuraConfigure({
      presetId,
      pitchId,
      volume,
      speed,
      fineSemis,
    });
  }, [fineSemis, isPlaying, pitchId, presetId, speed, volume]);

  useEffect(() => {
    if (!isRecording) return;
    stop();
  }, [isRecording, stop]);

  useEffect(() => {
    return () => {
      tanpuraStop();
      tanpuraDispose();
    };
  }, []);

  const setPitchId = useCallback(
    (next: TanpuraPitchId) => {
      setPitchIdStore(next);
    },
    [setPitchIdStore],
  );

  const setPresetId = useCallback(
    (next: TanpuraPresetId) => {
      setPresetIdStore(next);
    },
    [setPresetIdStore],
  );

  const setVolume = useCallback(
    (next: number) => {
      setVolumeStore(next);
    },
    [setVolumeStore],
  );

  const setSpeed = useCallback(
    (next: number) => {
      setSpeedStore(next);
    },
    [setSpeedStore],
  );

  const nudgeFineSemis = useCallback(
    (delta: number) => {
      nudgeFineSemisStore(delta);
    },
    [nudgeFineSemisStore],
  );

  const setLabelMode = useCallback(
    (next: TanpuraLabelMode) => {
      setLabelModeStore(next);
    },
    [setLabelModeStore],
  );

  return {
    isPlaying,
    isRecording,
    panelOpen,
    setPanelOpen,
    pitchId,
    presetId,
    volume,
    speed,
    fineSemis,
    labelMode,
    setPitchId,
    setPresetId,
    setVolume,
    setSpeed,
    nudgeFineSemis,
    setLabelMode,
    play,
    stop,
    toggle,
  };
}

export type TanpuraController = ReturnType<typeof useTanpuraController>;
