import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import {
  TANPURA_DEFAULT_FINE_SEMIS,
  TANPURA_DEFAULT_LABEL_MODE,
  TANPURA_DEFAULT_PITCH,
  TANPURA_DEFAULT_PRESET,
  TANPURA_DEFAULT_SPEED,
  TANPURA_DEFAULT_VOLUME,
  TANPURA_FINE_SEMIS_MAX,
  TANPURA_FINE_SEMIS_MIN,
  TANPURA_SPEED_MAX,
  TANPURA_SPEED_MIN,
} from '../constants';
import { isTanpuraLabelMode, isTanpuraPitchId } from '../data/pitches';
import { isTanpuraPresetId } from '../data/presets';
import type {
  TanpuraLabelMode,
  TanpuraPitchId,
  TanpuraPresetId,
} from '../types';

function clampVolume(volume: number): number {
  return Math.min(1, Math.max(0, volume));
}

function clampSpeed(speed: number): number {
  return Math.min(TANPURA_SPEED_MAX, Math.max(TANPURA_SPEED_MIN, speed));
}

function clampFineSemis(fineSemis: number): number {
  const rounded = Math.round(fineSemis);
  return Math.min(
    TANPURA_FINE_SEMIS_MAX,
    Math.max(TANPURA_FINE_SEMIS_MIN, rounded),
  );
}

type TanpuraPrefsState = {
  pitchId: TanpuraPitchId;
  presetId: TanpuraPresetId;
  volume: number;
  speed: number;
  fineSemis: number;
  labelMode: TanpuraLabelMode;
  setPitchId: (pitchId: TanpuraPitchId) => void;
  setPresetId: (presetId: TanpuraPresetId) => void;
  setVolume: (volume: number) => void;
  setSpeed: (speed: number) => void;
  setFineSemis: (fineSemis: number) => void;
  nudgeFineSemis: (delta: number) => void;
  setLabelMode: (labelMode: TanpuraLabelMode) => void;
};

const ssrSafeStorage: StateStorage = {
  getItem: async (name) => {
    if (typeof window === 'undefined') {
      return null;
    }
    return AsyncStorage.getItem(name);
  },
  setItem: async (name, value) => {
    if (typeof window === 'undefined') {
      return;
    }
    await AsyncStorage.setItem(name, value);
  },
  removeItem: async (name) => {
    if (typeof window === 'undefined') {
      return;
    }
    await AsyncStorage.removeItem(name);
  },
};

export const useTanpuraStore = create<TanpuraPrefsState>()(
  persist(
    (set) => ({
      pitchId: TANPURA_DEFAULT_PITCH,
      presetId: TANPURA_DEFAULT_PRESET,
      volume: TANPURA_DEFAULT_VOLUME,
      speed: TANPURA_DEFAULT_SPEED,
      fineSemis: TANPURA_DEFAULT_FINE_SEMIS,
      labelMode: TANPURA_DEFAULT_LABEL_MODE,
      setPitchId: (pitchId) => set({ pitchId }),
      setPresetId: (presetId) => set({ presetId }),
      setVolume: (volume) => set({ volume: clampVolume(volume) }),
      setSpeed: (speed) => set({ speed: clampSpeed(speed) }),
      setFineSemis: (fineSemis) =>
        set({ fineSemis: clampFineSemis(fineSemis) }),
      nudgeFineSemis: (delta) =>
        set((state) => ({
          fineSemis: clampFineSemis(state.fineSemis + delta),
        })),
      setLabelMode: (labelMode) => set({ labelMode }),
    }),
    {
      name: 'vibeogram.tanpura',
      storage: createJSONStorage(() => ssrSafeStorage),
      partialize: (state) => ({
        pitchId: state.pitchId,
        presetId: state.presetId,
        volume: state.volume,
        speed: state.speed,
        fineSemis: state.fineSemis,
        labelMode: state.labelMode,
      }),
      merge: (persisted, current) => {
        const raw = (persisted ?? {}) as Partial<TanpuraPrefsState>;
        return {
          ...current,
          pitchId:
            raw.pitchId && isTanpuraPitchId(raw.pitchId)
              ? raw.pitchId
              : current.pitchId,
          presetId:
            raw.presetId && isTanpuraPresetId(raw.presetId)
              ? raw.presetId
              : current.presetId,
          volume:
            typeof raw.volume === 'number' && Number.isFinite(raw.volume)
              ? clampVolume(raw.volume)
              : current.volume,
          speed:
            typeof raw.speed === 'number' && Number.isFinite(raw.speed)
              ? clampSpeed(raw.speed)
              : current.speed,
          fineSemis:
            typeof raw.fineSemis === 'number' && Number.isFinite(raw.fineSemis)
              ? clampFineSemis(raw.fineSemis)
              : current.fineSemis,
          labelMode:
            raw.labelMode && isTanpuraLabelMode(raw.labelMode)
              ? raw.labelMode
              : current.labelMode,
        };
      },
    },
  ),
);
