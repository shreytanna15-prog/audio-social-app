import { create } from 'zustand';

type InputMonitorState = {
  /** User preference: hear yourself in headphones while recording. */
  preferredEnabled: boolean;
  headsetConnected: boolean;
  routeLabel: string;
  setPreferredEnabled: (enabled: boolean) => void;
  togglePreferred: () => void;
  setHeadsetConnected: (connected: boolean, routeLabel?: string) => void;
};

export const useInputMonitorStore = create<InputMonitorState>((set, get) => ({
  preferredEnabled: false,
  headsetConnected: false,
  routeLabel: 'speaker',
  setPreferredEnabled: (enabled) => set({ preferredEnabled: enabled }),
  togglePreferred: () => set({ preferredEnabled: !get().preferredEnabled }),
  setHeadsetConnected: (connected, routeLabel) =>
    set({
      headsetConnected: connected,
      routeLabel: routeLabel ?? (connected ? 'headphones' : 'speaker'),
    }),
}));
