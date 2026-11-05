import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { inputMonitorService } from './input-monitor.service';
import { useInputMonitorStore } from '@/features/audio/store/input-monitor.store';

describe('inputMonitorService (integration)', () => {
  const remove = vi.fn();
  type RouteChangeEvent = { connected: boolean; routeLabel: string };
  const addListener = vi.fn(
    (_event: string, _listener: (e: RouteChangeEvent) => void) => ({ remove }),
  );
  const getRouteInfo = vi.fn(() => ({
    connected: true,
    routeLabel: 'Wired Headset',
  }));
  const isHeadsetConnected = vi.fn(() => true);
  const isAvailable = vi.fn(() => true);

  const mockNative = {
    isAvailable,
    isHeadsetConnected,
    getRouteInfo,
    addListener,
  };

  beforeEach(() => {
    remove.mockClear();
    addListener.mockClear();
    getRouteInfo.mockClear();
    isHeadsetConnected.mockClear();
    isAvailable.mockClear();
    getRouteInfo.mockReturnValue({
      connected: true,
      routeLabel: 'Wired Headset',
    });
    isHeadsetConnected.mockReturnValue(true);
    isAvailable.mockReturnValue(true);

    useInputMonitorStore.setState({
      preferredEnabled: false,
      headsetConnected: false,
      routeLabel: 'speaker',
    });
    inputMonitorService.__resetForTests();
    inputMonitorService.__setNativeModuleForTests(mockNative);
  });

  afterEach(() => {
    inputMonitorService.__resetForTests();
  });

  it('loads native via getter and reports available', () => {
    expect(inputMonitorService.isNativeAvailable()).toBe(true);
  });

  it('refreshHeadsetState writes connected route into the store', () => {
    const connected = inputMonitorService.refreshHeadsetState();
    expect(connected).toBe(true);
    expect(useInputMonitorStore.getState()).toMatchObject({
      headsetConnected: true,
      routeLabel: 'Wired Headset',
    });
  });

  it('startWatching subscribes once and applies route-change events', () => {
    inputMonitorService.startWatching();
    inputMonitorService.startWatching();

    expect(addListener).toHaveBeenCalledTimes(1);
    expect(addListener.mock.calls[0]?.[0]).toBe('onRouteChange');

    const listener = addListener.mock.calls[0]?.[1];
    expect(listener).toBeTypeOf('function');
    listener!({ connected: false, routeLabel: 'speaker' });

    expect(useInputMonitorStore.getState()).toMatchObject({
      headsetConnected: false,
      routeLabel: 'speaker',
    });

    inputMonitorService.stopWatching();
    expect(remove).toHaveBeenCalled();
  });

  it('falls back safely when getRouteInfo throws', () => {
    getRouteInfo.mockImplementationOnce(() => {
      throw new Error('boom');
    });
    useInputMonitorStore.getState().setHeadsetConnected(true, 'kept');
    const connected = inputMonitorService.refreshHeadsetState();
    expect(connected).toBe(true);
    expect(useInputMonitorStore.getState().routeLabel).toBe('kept');
  });
});
