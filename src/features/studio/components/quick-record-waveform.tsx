import { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { normalizeMetering } from '@/features/audio/domain/recorder-session.helpers';
import { liveClipWidthPx, slotBarCount } from '@/features/audio/domain/timeline';
import { useCaptureElapsed } from '@/features/audio/hooks/use-capture-elapsed';
import { recordingSessionService } from '@/features/audio/services/recording-session.service';
import { StudioPeakWaveform } from '@/features/studio/components/multitrack/studio-peak-waveform';
import { Text } from '@/shared/components/ui/text';

/** Visible time span across the waveform viewport. */
const LIVE_WINDOW_SECONDS = 25;
/** Grow from the left until this fraction of the window, then scroll. */
const FOLLOW_RATIO = 0.8;
const FOLLOW_LEAD_SECONDS = LIVE_WINDOW_SECONDS * FOLLOW_RATIO;
const TICK_COUNT = 6;
const WAVE_HEIGHT = 140;
const EMPTY_BAR_COUNT = 56;
const BAR_WIDTH = 3;

function formatTick(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  if (safe < 60) {
    return `${safe}s`;
  }
  const minutes = Math.floor(safe / 60);
  const rem = safe % 60;
  return `${minutes}:${rem.toString().padStart(2, '0')}`;
}

function buildTicks(windowStart: number, windowEnd: number): number[] {
  const span = Math.max(0.001, windowEnd - windowStart);
  return Array.from(
    { length: TICK_COUNT },
    (_, index) => windowStart + (index / (TICK_COUNT - 1)) * span,
  );
}

/** Fixed 0–25s until ~80%, then a sliding window with the head near 80%. */
function liveWindowForElapsed(elapsed: number): {
  windowStart: number;
  windowEnd: number;
  following: boolean;
} {
  if (elapsed < FOLLOW_LEAD_SECONDS) {
    return {
      windowStart: 0,
      windowEnd: LIVE_WINDOW_SECONDS,
      following: false,
    };
  }

  const windowStart = elapsed - FOLLOW_LEAD_SECONDS;
  return {
    windowStart,
    windowEnd: windowStart + LIVE_WINDOW_SECONDS,
    following: true,
  };
}

function playheadLeftForElapsed(elapsed: number, viewportWidth: number): number {
  if (viewportWidth <= 0) {
    return 0;
  }

  const pps = viewportWidth / LIVE_WINDOW_SECONDS;
  if (elapsed < FOLLOW_LEAD_SECONDS) {
    return Math.max(0, elapsed * pps - 6);
  }

  return Math.max(0, FOLLOW_LEAD_SECONDS * pps - 6);
}

type QuickRecordTimelineProps = {
  isRecording: boolean;
  /** Full take length when not recording. */
  durationSeconds?: number;
};

/**
 * Ruler stays on 0–25s while the take grows, then scrolls once elapsed
 * passes ~80% of the window so short takes don’t look longer than they are.
 */
export function QuickRecordTimeline({
  isRecording,
  durationSeconds = 0,
}: QuickRecordTimelineProps) {
  const elapsed = useCaptureElapsed(isRecording);

  let windowStart = 0;
  let windowEnd = LIVE_WINDOW_SECONDS;

  if (isRecording) {
    const live = liveWindowForElapsed(elapsed);
    windowStart = live.windowStart;
    windowEnd = live.windowEnd;
  } else if (durationSeconds > 0) {
    windowStart = 0;
    windowEnd = Math.max(durationSeconds, 0.1);
  }

  const ticks = buildTicks(windowStart, windowEnd);

  return (
    <View className="flex-row justify-between px-1 pt-1">
      {ticks.map((at, index) => (
        <Text
          key={`tick-${index}-${Math.floor(at)}`}
          variant="caption"
          className="text-slate-muted">
          {formatTick(at)}
        </Text>
      ))}
    </View>
  );
}

type QuickRecordWaveformProps = {
  peaks: number[];
  isRecording: boolean;
  hasTake: boolean;
  /** 0–1 progress along the take while playing back. */
  progress?: number;
};

/**
 * Grows left→right until ~80% of the window, then keeps that lead and
 * scrolls older bars off the left as new meter peaks append.
 */
function LiveMeterWave({ viewportWidth }: { viewportWidth: number }) {
  const [bars, setBars] = useState<number[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const pendingRef = useRef(0);
  const pps = viewportWidth > 0 ? viewportWidth / LIVE_WINDOW_SECONDS : 0;
  const ppsRef = useRef(pps);
  ppsRef.current = pps;

  useEffect(() => {
    const interval = setInterval(() => {
      const tick = recordingSessionService.getTick();
      const level = normalizeMetering(tick.metering);
      const seconds = tick.durationMillis / 1000;
      pendingRef.current = Math.max(pendingRef.current, level);
      setElapsed(seconds);

      const needed = slotBarCount(liveClipWidthPx(seconds, ppsRef.current));
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
  }, []);

  if (viewportWidth <= 0 || pps <= 0) {
    return null;
  }

  const following = elapsed >= FOLLOW_LEAD_SECONDS;
  const historyWidth = following
    ? FOLLOW_LEAD_SECONDS * pps
    : liveClipWidthPx(elapsed, pps);
  const visibleWidth = Math.min(viewportWidth, Math.max(0, historyWidth));
  if (visibleWidth <= 0) {
    return null;
  }

  const historySlots = slotBarCount(visibleWidth);
  const visibleBars =
    bars.length <= historySlots ? bars : bars.slice(bars.length - historySlots);

  return (
    <View style={{ width: visibleWidth, alignSelf: 'flex-start' }}>
      <StudioPeakWaveform
        peaks={visibleBars}
        height={WAVE_HEIGHT}
        width={visibleWidth}
        color="#A078FF"
        fillSlots={false}
        pinBars
        progress={1}
      />
    </View>
  );
}

function QuickRecordLiveCapture({ viewportWidth }: { viewportWidth: number }) {
  const elapsed = useCaptureElapsed(true);
  const playheadLeft = playheadLeftForElapsed(elapsed, viewportWidth);

  return (
    <>
      <LiveMeterWave viewportWidth={viewportWidth} />
      <Playhead left={playheadLeft} />
    </>
  );
}

function Playhead({ left }: { left: number }) {
  return (
    <View style={[styles.playhead, { left }]} pointerEvents="none">
      <View style={styles.playheadKnob} />
      <View style={styles.playheadLine} />
    </View>
  );
}

export function QuickRecordWaveform({
  peaks,
  isRecording,
  hasTake,
  progress = 0,
}: QuickRecordWaveformProps) {
  const [width, setWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    setWidth((prev) => (prev === next ? prev : next));
  };

  const showEmpty = !isRecording && !hasTake;
  const idlePlayheadLeft = hasTake
    ? Math.max(0, Math.min(1, progress)) * Math.max(0, width - 12)
    : 0;

  return (
    <View className="relative flex-1 justify-center" onLayout={onLayout}>
      {showEmpty ? (
        <View style={[styles.row, { height: WAVE_HEIGHT }]}>
          {Array.from({ length: EMPTY_BAR_COUNT }, (_, index) => (
            <View
              key={`bar-${index}`}
              style={[
                styles.bar,
                {
                  height: 4,
                  backgroundColor: '#3A3648',
                  opacity: 0.55,
                },
              ]}
            />
          ))}
        </View>
      ) : null}

      {isRecording && width > 0 ? (
        <QuickRecordLiveCapture viewportWidth={width} />
      ) : null}

      {!isRecording && hasTake && width > 0 ? (
        <>
          <StudioPeakWaveform
            peaks={peaks}
            height={WAVE_HEIGHT}
            width={width}
            color="#D0BCFF"
            progress={progress}
          />
          <Playhead left={idlePlayheadLeft} />
        </>
      ) : null}

      {showEmpty ? <Playhead left={0} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: 2,
  },
  playhead: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 12,
    alignItems: 'center',
  },
  playheadKnob: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#A078FF',
    boxShadow: '0 0 10px rgba(160, 120, 255, 0.55)',
  },
  playheadLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#A078FF',
    boxShadow: '0 0 8px rgba(160, 120, 255, 0.45)',
  },
});
