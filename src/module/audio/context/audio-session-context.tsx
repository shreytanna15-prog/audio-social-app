import { createContext, useContext } from 'react';

import type { RecorderStatus } from '@/module/audio/types/recorder';

export type AudioSessionContextValue = {
  status: RecorderStatus;
  timerSeconds: number;
  meteringBars: number[];
  previewUri: string | null;
  hasActiveSession: boolean;
  isPaused: boolean;
  handleMainAction: () => Promise<void>;
  handlePauseResume: () => void;
  resetSession: () => Promise<void>;
};

export const AudioSessionContext = createContext<AudioSessionContextValue | null>(null);

export function useAudioSession(): AudioSessionContextValue {
  const value = useContext(AudioSessionContext);

  if (!value) {
    throw new Error('useAudioSession must be used within an AudioSessionProvider');
  }

  return value;
}
