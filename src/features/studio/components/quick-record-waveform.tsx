import { useEffect, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import {
  LIVE_WINDOW_EDGE_SECONDS,
  LIVE_WINDOW_FOLLOW_LEAD_SECONDS,
  LIVE_WINDOW_FOLLOW_RATIO,
  LIVE_WINDOW_SECONDS,
  buildLiveWindowTicks,
  clampLiveWindowStart,
  followLiveWindowStart,
  formatLiveWindowTick,
  liveWindowPxPerSecond,
  maxLiveWindowStart,
  playheadLeftInLiveWindow,
} from '@/features/audio/domain/live-window';
import { normalizeMetering } from '@/features/audio/domain/recorder-session.helpers';
import { liveClipWidthPx, slotBarCount } from '@/features/audio/domain/timeline';
import { useCaptureElapsed } from '@/features/audio/hooks/use-capture-elapsed';
import { recordingSessionService } from '@/features/audio/services/recording-session.service';
import { StudioPeakWaveform } from '@/features/studio/components/multitrack/studio-peak-waveform';
import { Text } from '@/shared/components/ui/text';

export { LIVE_WINDOW_SECONDS };

const DEFAULT_WAVE_HEIGHT = 140;
const EMPTY_BAR_COUNT = 56;
const BAR_WIDTH = 3;

type QuickRecordTimelineProps = {
  isRecording: boolean;
  durationSeconds?: number;
  recordOriginSeconds?: number;
  /** Controlled 30s window start (shared with the waveform). */
  windowStartSeconds?: number;
};

/**
 * Ruler for the shared ~30s window — does not drive scroll itself.
 * While recording, follow is local (not parent state) so we never 10Hz-setState.
 */
export function QuickRecordTimeline({
  isRecording,
  recordOriginSeconds = 0,
  windowStartSeconds = 0,
}: QuickRecordTimelineProps) {
  const elapsed = useCaptureElapsed(isRecording);
  const timelineSeconds = isRecording
    ? Math.max(0, recordOriginSeconds) + elapsed
    : 0;

  const windowStart = isRecording
    ? followLiveWindowStart(timelineSeconds)
    : Math.max(0, windowStartSeconds);
  const windowEnd = windowStart + LIVE_WINDOW_SECONDS;
  const ticks = buildLiveWindowTicks(windowStart, windowEnd);

  return (
    <View className="flex-row justify-between pt-1">
      {ticks.map((at, index) => (
        <Text
          key={`tick-${index}-${Math.floor(at * 10) / 10}`}
          variant="caption"
          className="text-slate-muted">
          {formatLiveWindowTick(at)}
        </Text>
      ))}
    </View>
  );
}

type QuickRecordWaveformProps = {
  peaks: number[];
  isRecording: boolean;
  hasTake: boolean;
  isPlaying?: boolean;
  /** 0–1 progress along the take while playing back. */
  progress?: number;
  durationSeconds?: number;
  recordOriginSeconds?: number;
  /** Shared window start with the ruler. */
  windowStartSeconds?: number;
  onWindowStartChange?: (windowStartSeconds: number) => void;
  onScrubStart?: () => void;
  onSeek?: (seconds: number) => void;
  onScrubEnd?: (seconds: number) => void;
  /** Waveform canvas height — capture card uses a shorter strip; edit keeps default. */
  waveHeight?: number;
};

function LiveMeterWave({
  viewportWidth,
  waveHeight,
}: {
  viewportWidth: number;
  waveHeight: number;
}) {
  const [bars, setBars] = useState<number[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const pendingRef = useRef(0);
  const elapsedRef = useRef(0);
  const pps = viewportWidth > 0 ? viewportWidth / LIVE_WINDOW_SECONDS : 0;
  const ppsRef = useRef(pps);
  ppsRef.current = pps;

  useEffect(() => {
    const interval = setInterval(() => {
      const tick = recordingSessionService.getTick();
      const level = normalizeMetering(tick.metering);
      const seconds = tick.durationMillis / 1000;
      pendingRef.current = Math.max(pendingRef.current, level);
      if (Math.abs(seconds - elapsedRef.current) >= 0.05) {
        elapsedRef.current = seconds;
        setElapsed(seconds);
      }

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

  const following = elapsed >= LIVE_WINDOW_FOLLOW_LEAD_SECONDS;
  const historyWidth = following
    ? LIVE_WINDOW_FOLLOW_LEAD_SECONDS * pps
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
        height={waveHeight}
        width={visibleWidth}
        color="#A078FF"
        fillSlots={false}
        pinBars
        progress={1}
      />
    </View>
  );
}

function QuickRecordLiveCapture({
  viewportWidth,
  waveHeight,
}: {
  viewportWidth: number;
  waveHeight: number;
}) {
  const elapsed = useCaptureElapsed(true);
  const windowStart = followLiveWindowStart(elapsed);
  const playheadLeft = playheadLeftInLiveWindow(elapsed, windowStart, viewportWidth);

  return (
    <>
      <LiveMeterWave viewportWidth={viewportWidth} waveHeight={waveHeight} />
      <Playhead left={playheadLeft} />
    </>
  );
}

function StoredTakeWave({
  peaks,
  viewportWidth,
  durationSeconds,
  playheadSeconds,
  windowStart,
  showPlayhead = true,
  waveHeight,
}: {
  peaks: number[];
  viewportWidth: number;
  durationSeconds: number;
  playheadSeconds: number;
  windowStart: number;
  showPlayhead?: boolean;
  waveHeight: number;
}) {
  const takeDuration = Math.max(durationSeconds, 0.1);
  const playhead = Math.max(0, playheadSeconds);
  const pps = viewportWidth / LIVE_WINDOW_SECONDS;
  const takeStartX = (0 - windowStart) * pps;
  const takeWidth = Math.max(1, takeDuration * pps);
  const takeProgress = Math.min(1, Math.max(0, playhead / takeDuration));
  const playheadLeft = playheadLeftInLiveWindow(playhead, windowStart, viewportWidth);

  return (
    <>
      <View style={{ width: viewportWidth, overflow: 'hidden' }}>
        <View style={{ marginLeft: takeStartX, width: takeWidth }}>
          <StudioPeakWaveform
            peaks={peaks}
            height={waveHeight}
            width={takeWidth}
            color="#D0BCFF"
            progress={takeProgress}
          />
        </View>
      </View>
      {showPlayhead ? <Playhead left={playheadLeft} /> : null}
    </>
  );
}

function PunchInLiveMeter({
  viewportWidth,
  windowStart,
  originSeconds,
  waveHeight,
}: {
  viewportWidth: number;
  windowStart: number;
  originSeconds: number;
  waveHeight: number;
}) {
  const [bars, setBars] = useState<number[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const pendingRef = useRef(0);
  const pps = viewportWidth > 0 ? viewportWidth / LIVE_WINDOW_SECONDS : 0;
  const ppsRef = useRef(pps);
  ppsRef.current = pps;

  const elapsedRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const tick = recordingSessionService.getTick();
      const level = normalizeMetering(tick.metering);
      const seconds = tick.durationMillis / 1000;
      pendingRef.current = Math.max(pendingRef.current, level);
      if (Math.abs(seconds - elapsedRef.current) >= 0.05) {
        elapsedRef.current = seconds;
        setElapsed(seconds);
      }

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

  if (viewportWidth <= 0 || pps <= 0 || elapsed <= 0 || bars.length === 0) {
    return null;
  }

  const startX = (originSeconds - windowStart) * pps;
  const liveWidth = liveClipWidthPx(elapsed, pps);
  const visibleLeft = Math.max(0, startX);
  const visibleRight = Math.min(viewportWidth, startX + liveWidth);
  const visibleWidth = visibleRight - visibleLeft;
  if (visibleWidth <= 1) {
    return null;
  }

  const cropLeft = Math.max(0, -startX);
  const historySlots = slotBarCount(liveWidth);
  const fullBars =
    bars.length <= historySlots ? bars : bars.slice(bars.length - historySlots);
  const cropSlots = slotBarCount(cropLeft);
  const visibleSlots = slotBarCount(visibleWidth);
  const visibleBars = fullBars.slice(
    cropSlots,
    Math.max(cropSlots + 1, cropSlots + visibleSlots),
  );

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: visibleLeft,
        width: visibleWidth,
        height: waveHeight,
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
      <StudioPeakWaveform
        peaks={visibleBars.length > 0 ? visibleBars : fullBars}
        height={waveHeight}
        width={visibleWidth}
        color="#A078FF"
        fillSlots={false}
        pinBars
        progress={1}
      />
    </View>
  );
}

function PunchInLiveCapture({
  peaks,
  viewportWidth,
  durationSeconds,
  recordOriginSeconds,
  waveHeight,
}: {
  peaks: number[];
  viewportWidth: number;
  durationSeconds: number;
  recordOriginSeconds: number;
  waveHeight: number;
}) {
  const elapsed = useCaptureElapsed(true);
  const origin = Math.max(0, recordOriginSeconds);
  const timelineSeconds = origin + elapsed;
  // Local follow only — never push 10Hz window updates to parent state.
  const windowStart = followLiveWindowStart(timelineSeconds);
  const playheadLeft = playheadLeftInLiveWindow(
    timelineSeconds,
    windowStart,
    viewportWidth,
  );

  return (
    <View style={{ width: viewportWidth, height: waveHeight, justifyContent: 'center' }}>
      <StoredTakeWave
        peaks={peaks}
        viewportWidth={viewportWidth}
        durationSeconds={durationSeconds}
        playheadSeconds={timelineSeconds}
        windowStart={windowStart}
        showPlayhead={false}
        waveHeight={waveHeight}
      />
      <PunchInLiveMeter
        viewportWidth={viewportWidth}
        windowStart={windowStart}
        originSeconds={origin}
        waveHeight={waveHeight}
      />
      <Playhead left={playheadLeft} />
    </View>
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

/**
 * Stored take: native horizontal scroll pans the timeline; tap seeks the playhead.
 * Same interaction model as multi-track (swipe vs tap).
 */
function ScrollableStoredTake({
  peaks,
  viewportWidth,
  durationSeconds,
  playheadSeconds,
  windowStartSeconds,
  isPlaying,
  waveHeight,
  onWindowStartChange,
  onScrubStart,
  onSeek,
  onScrubEnd,
}: {
  peaks: number[];
  viewportWidth: number;
  durationSeconds: number;
  playheadSeconds: number;
  windowStartSeconds: number;
  isPlaying: boolean;
  waveHeight: number;
  onWindowStartChange?: (windowStartSeconds: number) => void;
  onScrubStart?: () => void;
  onSeek?: (seconds: number) => void;
  onScrubEnd?: (seconds: number) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollXRef = useRef(0);
  const userScrollingRef = useRef(false);
  const programmaticScrollRef = useRef(false);
  const onWindowStartChangeRef = useRef(onWindowStartChange);
  onWindowStartChangeRef.current = onWindowStartChange;

  const pps = liveWindowPxPerSecond(viewportWidth);
  const takeDuration = Math.max(durationSeconds, 0.1);
  const contentWidth = Math.max(takeDuration, LIVE_WINDOW_SECONDS) * pps;
  const takeWidth = Math.max(1, takeDuration * pps);
  const playhead = Math.max(0, Math.min(takeDuration, playheadSeconds));
  const takeProgress = Math.min(1, Math.max(0, playhead / takeDuration));
  const playheadX = playhead * pps;
  const seekEnabled = Boolean(onSeek || onScrubEnd);

  const emitWindowFromScrollX = (scrollX: number) => {
    if (pps <= 0) {
      return;
    }
    const next = clampLiveWindowStart(scrollX / pps, durationSeconds);
    onWindowStartChangeRef.current?.(next);
  };

  const scrollToWindowStart = (startSeconds: number, animated: boolean) => {
    if (pps <= 0 || viewportWidth <= 0) {
      return;
    }
    const maxScroll = Math.max(0, contentWidth - viewportWidth);
    const x = Math.max(
      0,
      Math.min(maxScroll, clampLiveWindowStart(startSeconds, durationSeconds) * pps),
    );
    if (Math.abs(x - scrollXRef.current) < 1) {
      return;
    }
    programmaticScrollRef.current = true;
    scrollXRef.current = x;
    scrollRef.current?.scrollTo({ x, animated });
  };

  // Keep ScrollView aligned when parent window changes (record stop, clamp, etc.).
  useEffect(() => {
    if (userScrollingRef.current) {
      return;
    }
    scrollToWindowStart(windowStartSeconds, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync from parent window only
  }, [windowStartSeconds, pps, contentWidth, viewportWidth, durationSeconds]);

  // Playback: keep playhead in view with native scroll (no drag-coupled window).
  useEffect(() => {
    if (!isPlaying || userScrollingRef.current || pps <= 0 || viewportWidth <= 0) {
      return;
    }
    const left = scrollXRef.current;
    const right = left + viewportWidth;
    const edgePx = LIVE_WINDOW_EDGE_SECONDS * pps;
    if (playheadX >= left + edgePx && playheadX <= right - edgePx) {
      return;
    }
    const targetStart =
      playheadX / pps - LIVE_WINDOW_SECONDS * LIVE_WINDOW_FOLLOW_RATIO;
    scrollToWindowStart(targetStart, false);
    emitWindowFromScrollX(
      Math.max(0, Math.min(maxLiveWindowStart(durationSeconds) * pps, targetStart * pps)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, playheadX, pps, viewportWidth, durationSeconds]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    scrollXRef.current = x;
    if (programmaticScrollRef.current) {
      return;
    }
    emitWindowFromScrollX(x);
  };

  const endProgrammaticScroll = () => {
    programmaticScrollRef.current = false;
  };

  const seekFromContentX = (locationX: number) => {
    if (!seekEnabled || pps <= 0) {
      return;
    }
    const seconds = Math.min(
      durationSeconds,
      Math.max(0, locationX / pps),
    );
    onScrubStart?.();
    onSeek?.(seconds);
    onScrubEnd?.(seconds);
  };

  if (viewportWidth <= 0 || pps <= 0) {
    return null;
  }

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      nestedScrollEnabled
      directionalLockEnabled
      showsHorizontalScrollIndicator={false}
      bounces={false}
      decelerationRate="normal"
      scrollEventThrottle={16}
      onScroll={onScroll}
      onScrollBeginDrag={() => {
        userScrollingRef.current = true;
        programmaticScrollRef.current = false;
      }}
      onScrollEndDrag={() => {
        userScrollingRef.current = false;
        emitWindowFromScrollX(scrollXRef.current);
      }}
      onMomentumScrollBegin={() => {
        userScrollingRef.current = true;
      }}
      onMomentumScrollEnd={() => {
        userScrollingRef.current = false;
        endProgrammaticScroll();
        emitWindowFromScrollX(scrollXRef.current);
      }}
      style={{ width: viewportWidth, height: waveHeight }}>
      <Pressable
        accessibilityRole="adjustable"
        accessibilityLabel="Waveform. Swipe to scroll, tap to move playhead"
        onPress={(event) => seekFromContentX(event.nativeEvent.locationX)}
        style={{ width: contentWidth, height: waveHeight, justifyContent: 'center' }}>
        <View style={{ width: takeWidth }}>
          <StudioPeakWaveform
            peaks={peaks}
            height={waveHeight}
            width={takeWidth}
            color="#D0BCFF"
            progress={takeProgress}
          />
        </View>
        <Playhead left={Math.max(0, playheadX - 6)} />
      </Pressable>
    </ScrollView>
  );
}

export function QuickRecordWaveform({
  peaks,
  isRecording,
  hasTake,
  isPlaying = false,
  progress = 0,
  durationSeconds = 0,
  recordOriginSeconds = 0,
  windowStartSeconds = 0,
  onWindowStartChange,
  onScrubStart,
  onSeek,
  onScrubEnd,
  waveHeight = DEFAULT_WAVE_HEIGHT,
}: QuickRecordWaveformProps) {
  const [width, setWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    setWidth((prev) => (prev === next ? prev : next));
  };

  const showEmpty = !isRecording && !hasTake;
  const punchInRecording = isRecording && hasTake;
  const firstTakeRecording = isRecording && !hasTake;
  const idlePlayheadSeconds =
    Math.max(0, progress) * Math.max(durationSeconds, 0);

  // After recording stops, park the window so the playhead is on-screen.
  const wasRecordingRef = useRef(isRecording);
  useEffect(() => {
    const wasRecording = wasRecordingRef.current;
    wasRecordingRef.current = isRecording;
    if (wasRecording && !isRecording && hasTake && durationSeconds > 0) {
      const playhead = idlePlayheadSeconds;
      const start = Math.max(
        0,
        playhead - LIVE_WINDOW_SECONDS * LIVE_WINDOW_FOLLOW_RATIO,
      );
      onWindowStartChange?.(clampLiveWindowStart(start, durationSeconds));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot on record stop
  }, [isRecording]);

  // Keep window valid when take length changes.
  useEffect(() => {
    if (durationSeconds <= 0 || !onWindowStartChange) {
      return;
    }
    onWindowStartChange(clampLiveWindowStart(windowStartSeconds, durationSeconds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationSeconds]);

  return (
    <View className="relative flex-1 justify-center" onLayout={onLayout}>
      {showEmpty ? (
        <View style={[styles.row, { height: waveHeight }]}>
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

      {firstTakeRecording && width > 0 ? (
        <QuickRecordLiveCapture viewportWidth={width} waveHeight={waveHeight} />
      ) : null}

      {punchInRecording && width > 0 ? (
        <PunchInLiveCapture
          peaks={peaks}
          viewportWidth={width}
          durationSeconds={durationSeconds}
          recordOriginSeconds={recordOriginSeconds}
          waveHeight={waveHeight}
        />
      ) : null}

      {!isRecording && hasTake && width > 0 ? (
        <ScrollableStoredTake
          peaks={peaks}
          viewportWidth={width}
          durationSeconds={durationSeconds}
          playheadSeconds={idlePlayheadSeconds}
          windowStartSeconds={windowStartSeconds}
          isPlaying={isPlaying}
          waveHeight={waveHeight}
          onWindowStartChange={onWindowStartChange}
          onScrubStart={onScrubStart}
          onSeek={onSeek}
          onScrubEnd={onScrubEnd}
        />
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
