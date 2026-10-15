import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { StudioPeakWaveform } from '@/features/studio/components/multitrack/studio-peak-waveform';
import { normalizeMetering } from '@/features/audio/domain/recorder-session.helpers';
import { liveClipWidthPx, slotBarCount } from '@/features/audio/domain/timeline';
import { useCaptureElapsed } from '@/features/audio/hooks/use-capture-elapsed';
import { recordingSessionService } from '@/features/audio/services/recording-session.service';

type StudioLiveWaveProps = {
  height: number;
  width: number;
  color: string;
  captureActive: boolean;
};

/**
 * Reads the meter locally. Must not subscribe to the session store — that
 * broadcast would re-render anything else listening on the same clock.
 * Bars are pinned to timeline slots so history does not slide as the take grows.
 */
export function StudioLiveWave({ height, width, color, captureActive }: StudioLiveWaveProps) {
  const [bars, setBars] = useState<number[]>([]);
  const widthRef = useRef(width);
  const pendingRef = useRef(0);
  widthRef.current = width;

  useEffect(() => {
    if (!captureActive) {
      return;
    }

    const interval = setInterval(() => {
      const level = normalizeMetering(recordingSessionService.getTick().metering);
      pendingRef.current = Math.max(pendingRef.current, level);
      const needed = slotBarCount(widthRef.current);
      if (needed <= 0) {
        return;
      }

      setBars((previous) => {
        if (previous.length >= needed) {
          return previous;
        }

        const next = previous.slice();
        while (next.length < needed) {
          next.push(pendingRef.current);
        }
        pendingRef.current = 0;
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [captureActive]);

  return (
    <StudioPeakWaveform
      peaks={bars}
      height={height}
      width={width}
      color={color}
      progress={1}
      pinBars
    />
  );
}

type StudioLiveClipProps = {
  color: string;
  waveHeight: number;
  captureActive: boolean;
  pps: number;
  stemOffsetWidth?: number;
  stemClipWidth?: number;
  liveOffsetWidth?: number;
  stemPeaks?: number[];
  stemDimmed?: boolean;
  pinStemBars?: boolean;
};

/** Grows the live take without re-rendering sibling waveform lanes. */
export function StudioLiveClip({
  color,
  waveHeight,
  captureActive,
  pps,
  stemOffsetWidth = 0,
  stemClipWidth = 0,
  liveOffsetWidth = 0,
  stemPeaks,
  stemDimmed = false,
  pinStemBars = false,
}: StudioLiveClipProps) {
  const liveElapsed = useCaptureElapsed(captureActive);
  const heldElapsed = useRef(0);
  if (captureActive) {
    heldElapsed.current = liveElapsed;
  }
  const elapsed = captureActive ? liveElapsed : heldElapsed.current;
  const clipWidth = liveClipWidthPx(elapsed, pps);
  const liveHead = liveOffsetWidth + clipWidth;
  const intoStem = liveHead - stemOffsetWidth;
  const suffixWidth =
    stemClipWidth > 0 ? Math.max(0, stemClipWidth - Math.max(0, intoStem)) : 0;

  return (
    <View style={styles.timelineRow}>
      {clipWidth > 0 ? (
        <View style={{ width: clipWidth }}>
          <StudioLiveWave
            height={waveHeight}
            width={clipWidth}
            color={color}
            captureActive={captureActive}
          />
        </View>
      ) : null}
      {suffixWidth > 0 && stemPeaks && stemPeaks.length > 0 ? (
        <View style={[styles.suffixClip, { width: suffixWidth }]}>
          <View style={{ marginLeft: -Math.max(0, intoStem) }}>
            <StudioPeakWaveform
              peaks={stemPeaks}
              height={waveHeight}
              width={stemClipWidth}
              color={color}
              progress={1}
              dimmed={stemDimmed}
              pinBars={pinStemBars}
            />
          </View>
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
  suffixClip: {
    overflow: 'hidden',
  },
});
