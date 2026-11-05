import { useCallback, useEffect } from 'react';

import { expoPcmCaptureService } from '@/features/audio/services/expo-pcm-capture.service';
import { inputMonitorService } from '@/features/audio/services/input-monitor.service';
import { useInputMonitorStore } from '@/features/audio/store/input-monitor.store';

export function useInputMonitor() {
  const preferredEnabled = useInputMonitorStore((s) => s.preferredEnabled);
  const headsetConnected = useInputMonitorStore((s) => s.headsetConnected);
  const routeLabel = useInputMonitorStore((s) => s.routeLabel);

  useEffect(() => {
    inputMonitorService.startWatching();
    return () => {
      inputMonitorService.stopWatching();
    };
  }, []);

  useEffect(() => {
    if (headsetConnected || !preferredEnabled) {
      return;
    }
    useInputMonitorStore.getState().setPreferredEnabled(false);
    expoPcmCaptureService.setInputMonitor(false);
  }, [headsetConnected, preferredEnabled]);

  const toggleMonitor = useCallback(() => {
    const store = useInputMonitorStore.getState();
    if (!store.headsetConnected) {
      return;
    }
    const next = !store.preferredEnabled;
    store.setPreferredEnabled(next);
    expoPcmCaptureService.setInputMonitor(next);
  }, []);

  return {
    preferredEnabled,
    headsetConnected,
    routeLabel,
    isMonitoringActive: preferredEnabled && headsetConnected,
    toggleMonitor,
  };
}
