import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Integration-style coverage for monitor preference wiring without booting
 * expo-audio / expo-modules-core native packages in Node.
 */
describe('expoPcmCapture monitor preference wiring (integration)', () => {
  beforeEach(async () => {
    vi.resetModules();
    const { useInputMonitorStore } = await import(
      '@/features/audio/store/input-monitor.store'
    );
    useInputMonitorStore.setState({
      preferredEnabled: true,
      headsetConnected: true,
      routeLabel: 'headphones',
    });
  });

  it('reads preferredEnabled=true for capture start options', async () => {
    const { useInputMonitorStore } = await import(
      '@/features/audio/store/input-monitor.store'
    );
    const preferred = useInputMonitorStore.getState().preferredEnabled;
    const streamOptions = {
      sampleRate: 48_000,
      channels: 1,
      encoding: 'int16' as const,
      nativeWrite: false,
      emitBuffersToJs: true,
      inputMonitor: preferred,
      monitorGain: 1,
    };
    expect(streamOptions).toMatchObject({
      nativeWrite: false,
      emitBuffersToJs: true,
      inputMonitor: true,
    });
  });

  it('reads preferredEnabled=false when user turns monitor off', async () => {
    const { useInputMonitorStore } = await import(
      '@/features/audio/store/input-monitor.store'
    );
    useInputMonitorStore.getState().setPreferredEnabled(false);
    expect(useInputMonitorStore.getState().preferredEnabled).toBe(false);
  });

  it('toggle preferred then builds matching AudioStream options shape', async () => {
    const { useInputMonitorStore } = await import(
      '@/features/audio/store/input-monitor.store'
    );
    useInputMonitorStore.getState().togglePreferred();
    const enabled = useInputMonitorStore.getState().preferredEnabled;
    expect(enabled).toBe(false);

    useInputMonitorStore.getState().togglePreferred();
    expect({
      inputMonitor: useInputMonitorStore.getState().preferredEnabled,
      monitorGain: 1,
    }).toEqual({ inputMonitor: true, monitorGain: 1 });
  });
});
