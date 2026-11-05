import { NativeModule, requireNativeModule } from 'expo-modules-core';

import type { HeadsetRouteInfo } from './InputMonitor.types';

declare class InputMonitorModuleClass extends NativeModule<{
  onRouteChange(event: HeadsetRouteInfo): void;
}> {
  isAvailable(): boolean;
  isHeadsetConnected(): boolean;
  getRouteInfo(): HeadsetRouteInfo;
}

let cached: InputMonitorModuleClass | null | undefined;

export function getInputMonitorNativeModule(): InputMonitorModuleClass | null {
  if (cached !== undefined) {
    return cached;
  }

  try {
    cached = requireNativeModule<InputMonitorModuleClass>('InputMonitor');
  } catch {
    cached = null;
  }

  return cached;
}

/** Test-only: clear the requireNativeModule cache between cases. */
export function __resetInputMonitorNativeModuleForTests(): void {
  cached = undefined;
}

export default getInputMonitorNativeModule;
