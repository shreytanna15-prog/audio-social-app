import { type EventSubscription } from 'expo-modules-core';

import { useInputMonitorStore } from '@/features/audio/store/input-monitor.store';

type HeadsetRouteInfo = {
  connected: boolean;
  routeLabel: string;
};

type InputMonitorNative = {
  isAvailable(): boolean;
  isHeadsetConnected(): boolean;
  getRouteInfo(): HeadsetRouteInfo;
  addListener(
    event: 'onRouteChange',
    listener: (event: HeadsetRouteInfo) => void,
  ): EventSubscription;
};

let nativeModule: InputMonitorNative | null | undefined;
let routeSub: EventSubscription | null = null;

function resolveNativeFromExport(mod: unknown): InputMonitorNative | null {
  if (!mod || typeof mod !== 'object') {
    return null;
  }

  const record = mod as {
    getInputMonitorNativeModule?: () => InputMonitorNative | null;
    default?: (() => InputMonitorNative | null) | InputMonitorNative | null;
  };

  const fromNamed =
    typeof record.getInputMonitorNativeModule === 'function'
      ? record.getInputMonitorNativeModule()
      : null;
  if (fromNamed && typeof fromNamed.isHeadsetConnected === 'function') {
    return fromNamed;
  }

  const fallback = record.default;
  if (typeof fallback === 'function') {
    const resolved = fallback();
    if (resolved && typeof resolved.isHeadsetConnected === 'function') {
      return resolved;
    }
    return null;
  }

  if (fallback && typeof fallback.isHeadsetConnected === 'function') {
    return fallback;
  }

  return null;
}

function loadNative(): InputMonitorNative | null {
  if (nativeModule !== undefined) {
    return nativeModule;
  }

  try {
    // Local Expo module — present after a native rebuild that includes input-monitor.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('input-monitor');
    nativeModule = resolveNativeFromExport(mod);
  } catch {
    nativeModule = null;
  }

  return nativeModule;
}

function applyRouteInfo(info: HeadsetRouteInfo): void {
  useInputMonitorStore.getState().setHeadsetConnected(info.connected, info.routeLabel);
}

export const inputMonitorService = {
  /** Test-only: inject a fake native module (skips require). */
  __setNativeModuleForTests(mod: InputMonitorNative | null): void {
    nativeModule = mod;
  },

  /** Test-only: clear module cache + stop listeners. */
  __resetForTests(): void {
    routeSub?.remove();
    routeSub = null;
    nativeModule = undefined;
  },


  isNativeAvailable(): boolean {
    return loadNative()?.isAvailable?.() === true;
  },

  refreshHeadsetState(): boolean {
    const native = loadNative();
    if (!native) {
      return useInputMonitorStore.getState().headsetConnected;
    }

    try {
      const info =
        typeof native.getRouteInfo === 'function'
          ? native.getRouteInfo()
          : {
              connected: native.isHeadsetConnected(),
              routeLabel: native.isHeadsetConnected() ? 'headphones' : 'speaker',
            };
      applyRouteInfo(info);
      return info.connected;
    } catch {
      return useInputMonitorStore.getState().headsetConnected;
    }
  },

  /** Start listening for plug/unplug. Safe to call multiple times. */
  startWatching(): void {
    if (routeSub) {
      this.refreshHeadsetState();
      return;
    }

    const native = loadNative();
    this.refreshHeadsetState();
    if (!native || typeof native.addListener !== 'function') {
      return;
    }

    try {
      routeSub = native.addListener('onRouteChange', (event) => {
        applyRouteInfo({
          connected: Boolean(event?.connected),
          routeLabel: event?.routeLabel || (event?.connected ? 'headphones' : 'speaker'),
        });
      });
    } catch {
      routeSub = null;
    }
  },

  stopWatching(): void {
    routeSub?.remove();
    routeSub = null;
  },
};
