import { beforeEach, describe, expect, it } from 'vitest';

import { useInputMonitorStore } from './input-monitor.store';

describe('input-monitor.store (unit)', () => {
  beforeEach(() => {
    useInputMonitorStore.setState({
      preferredEnabled: false,
      headsetConnected: false,
      routeLabel: 'speaker',
    });
  });

  it('defaults to monitor off and speaker route', () => {
    const state = useInputMonitorStore.getState();
    expect(state.preferredEnabled).toBe(false);
    expect(state.headsetConnected).toBe(false);
    expect(state.routeLabel).toBe('speaker');
  });

  it('toggles preferred monitoring on/off', () => {
    useInputMonitorStore.getState().togglePreferred();
    expect(useInputMonitorStore.getState().preferredEnabled).toBe(true);
    useInputMonitorStore.getState().togglePreferred();
    expect(useInputMonitorStore.getState().preferredEnabled).toBe(false);
  });

  it('setPreferredEnabled is explicit', () => {
    useInputMonitorStore.getState().setPreferredEnabled(true);
    expect(useInputMonitorStore.getState().preferredEnabled).toBe(true);
    useInputMonitorStore.getState().setPreferredEnabled(false);
    expect(useInputMonitorStore.getState().preferredEnabled).toBe(false);
  });

  it('setHeadsetConnected updates route label (default and custom)', () => {
    useInputMonitorStore.getState().setHeadsetConnected(true);
    expect(useInputMonitorStore.getState()).toMatchObject({
      headsetConnected: true,
      routeLabel: 'headphones',
    });

    useInputMonitorStore.getState().setHeadsetConnected(true, 'AirPods Pro');
    expect(useInputMonitorStore.getState().routeLabel).toBe('AirPods Pro');

    useInputMonitorStore.getState().setHeadsetConnected(false);
    expect(useInputMonitorStore.getState()).toMatchObject({
      headsetConnected: false,
      routeLabel: 'speaker',
    });
  });
});
