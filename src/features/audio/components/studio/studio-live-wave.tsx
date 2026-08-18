import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { StudioPeakWaveform } from '@/features/audio/components/studio/studio-peak-waveform';
import { normalizeMetering } from '@/features/audio/domain/recorder-session.helpers';
import { clipWidthPx } from '@/features/audio/domain/timeline';
import { useCaptureElapsed } from '@/features/audio/hooks/use-capture-elapsed';
import { recordingSessionService } from '@/features/audio/services/recording-session.service';

type StudioLiveWaveProps = {
  height: number;
  width: number;
  color: string;
};

/**
 * Reads the meter locally. Must not subscribe to the session store — that
 * broadcast would re-render anything else listening on the same clock.
 */
export function StudioLiveWave({ height, width, color }: StudioLiveWaveProps) {
  const [bars, setBars] = useState(() => Array.from({ length: 20 }, () => 0.15));

  useEffect(() => {
    const interval = setInterval(() => {
      const tick = recordingSessionService.getTick();
      setBars((previous) => [...previous.slice(1), normalizeMetering(tick.metering)]);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <StudioPeakWaveform
      peaks={bars}
      height={height}
      width={width}
      color={color}
      progress={1}
      fillSlots={false}
    />
  );
}

type StudioLiveClipProps = {
  offsetWidth: number;
  contentWidth: number;
  color: string;
  muted: boolean;
  waveHeight: number;
};

/** Grows the live take without re-rendering sibling waveform lanes. */
export function StudioLiveClip({
  offsetWidth,
  contentWidth,
  color,
  muted,
  waveHeight,
}: StudioLiveClipProps) {
  const elapsed = useCaptureElapsed(true);
  const clipWidth = clipWidthPx(elapsed);
  const tailWidth = Math.max(0, contentWidth - offsetWidth - clipWidth);

  return (
    <View style={styles.timelineRow}>
      {offsetWidth > 0 ? <View style={{ width: offsetWidth }} /> : null}
      {clipWidth > 0 ? (
        <View style={{ width: clipWidth }}>
          <StudioLiveWave height={waveHeight} width={clipWidth} color={color} />
        </View>
      ) : null}
      {tailWidth > 0 ? (
        <View style={[styles.tailSegment, { width: tailWidth }]}>
          <View style={[styles.tailLine, muted && styles.tailLineDimmed]} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  timelineRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tailSegment: {
    justifyContent: 'center',
    paddingRight: 8,
  },
  tailLine: {
    height: 2,
    borderRadius: 1,
    backgroundColor: '#D7DDE5',
  },
  tailLineDimmed: {
    opacity: 0.45,
  },
});
