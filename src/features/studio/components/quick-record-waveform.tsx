import { useEffect, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import {
  LIVE_WINDOW_EDGE_SECONDS,
  LIVE_WINDOW_FOLLOW_RATIO,
  LIVE_WINDOW_SECONDS,
  buildLiveWindowRulerMarks,
  clampLiveWindowStart,
  edgeEnsureLiveWindowStart,
  followLiveWindowStart,
  formatLiveWindowTick,
  liveWindowPxPerSecond,
  maxLiveWindowStart,
  playheadLeftInLiveWindow,
  secondsFromLiveWindowX,
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
export const RULER_HEIGHT = 28;
/** Label row above ticks — playhead starts below this so numbers stay clear. */
const RULER_LABEL_INSET = 16;

type QuickRecordTimelineProps = {
  isRecording: boolean;
  durationSeconds?: number;
  recordOriginSeconds?: number;
  /** Controlled 30s window start (shared with the waveform). */
  windowStartSeconds?: number;
  onWindowStartChange?: (windowStartSeconds: number) => void;
  /** Playhead time while idle / scrubbing / playing. */
  playheadSeconds?: number;
  /** When set, tap/drag anywhere on the ruler seeks the playhead. */
  onScrubStart?: () => void;
  onSeek?: (seconds: number) => void;
  onScrubEnd?: (seconds: number) => void;
};

/**
 * Ruler for the shared ~30s window — does not drive scroll itself.
 * While recording, follow is local (not parent state) so we never 10Hz-setState.
 * Optional scrub handlers make the ruler a seek surface (Multitrack).
 */
export function QuickRecordTimeline({
  isRecording,
  durationSeconds = 0,
  recordOriginSeconds = 0,
  windowStartSeconds = 0,
  onWindowStartChange,
  playheadSeconds = 0,
  onScrubStart,
  onSeek,
  onScrubEnd,
}: QuickRecordTimelineProps) {
  const elapsed = useCaptureElapsed(isRecording);
  const [viewportWidth, setViewportWidth] = useState(0);
  const scrubbingRef = useRef(false);
  const windowStartRef = useRef(windowStartSeconds);
  windowStartRef.current = windowStartSeconds;

  const timelineSeconds = isRecording
    ? Math.max(0, recordOriginSeconds) + elapsed
    : Math.max(0, playheadSeconds);

  const windowStart = isRecording
    ? followLiveWindowStart(timelineSeconds)
    : Math.max(0, windowStartSeconds);
  const windowEnd = windowStart + LIVE_WINDOW_SECONDS;
  const marks = buildLiveWindowRulerMarks(windowStart, windowEnd);
  const caretSeconds = isRecording
    ? timelineSeconds
    : Math.max(0, playheadSeconds);
  const nowRatio = Math.min(
    1,
    Math.max(0, (caretSeconds - windowStart) / LIVE_WINDOW_SECONDS),
  );

  const scrubEnabled =
    Boolean(onSeek || onScrubEnd) &&
    !isRecording &&
    durationSeconds > 0 &&
    viewportWidth > 0;

  const secondsFromEvent = (event: GestureResponderEvent) => {
    return secondsFromLiveWindowX(
      event.nativeEvent.locationX,
      windowStartRef.current,
      viewportWidth,
      durationSeconds,
    );
  };

  const beginScrub = (event: GestureResponderEvent) => {
    if (!scrubEnabled) {
      return;
    }
    scrubbingRef.current = true;
    const seconds = secondsFromEvent(event);
    onScrubStart?.();
    onSeek?.(seconds);
    const nextWindow = edgeEnsureLiveWindowStart(
      seconds,
      windowStartRef.current,
      durationSeconds,
    );
    if (Math.abs(nextWindow - windowStartRef.current) >= 0.001) {
      onWindowStartChange?.(nextWindow);
    }
  };

  const moveScrub = (event: GestureResponderEvent) => {
    if (!scrubbingRef.current || !scrubEnabled) {
      return;
    }
    const seconds = secondsFromEvent(event);
    onSeek?.(seconds);
    const nextWindow = edgeEnsureLiveWindowStart(
      seconds,
      windowStartRef.current,
      durationSeconds,
    );
    if (Math.abs(nextWindow - windowStartRef.current) >= 0.001) {
      onWindowStartChange?.(nextWindow);
    }
  };

  const endScrub = (event: GestureResponderEvent) => {
    if (!scrubbingRef.current) {
      return;
    }
    scrubbingRef.current = false;
    onScrubEnd?.(secondsFromEvent(event));
  };

  return (
    <View
      style={styles.ruler}
      onLayout={(event) => {
        const next = event.nativeEvent.layout.width;
        setViewportWidth((prev) => (prev === next ? prev : next));
      }}
      onStartShouldSetResponder={() => scrubEnabled}
      onMoveShouldSetResponder={() => scrubEnabled}
      onResponderGrant={beginScrub}
      onResponderMove={moveScrub}
      onResponderRelease={endScrub}
      onResponderTerminate={endScrub}>
      <View style={styles.rulerLabels} pointerEvents="none">
        {marks
          .filter((mark) => mark.major)
          .map((mark) => (
            <Text
              key={`label-${mark.at}`}
              variant="caption"
              style={[
                styles.rulerLabel,
                {
                  left: `${mark.ratio * 100}%`,
                  transform: [
                    {
                      translateX:
                        mark.ratio <= 0.02 ? 0 : mark.ratio >= 0.98 ? -26 : -13,
                    },
                  ],
                },
              ]}>
              {formatLiveWindowTick(mark.at)}
            </Text>
          ))}
      </View>
      <View style={styles.rulerTrack} pointerEvents="none">
        <View style={styles.rulerBaseline} />
        {marks.map((mark) => (
          <View
            key={`tick-${mark.at}`}
            pointerEvents="none"
            style={[
              styles.rulerTick,
              mark.major ? styles.rulerTickMajor : styles.rulerTickMinor,
              { left: `${mark.ratio * 100}%` },
            ]}
          />
        ))}
        <View
          pointerEvents="none"
          style={[styles.nowCaret, { left: `${nowRatio * 100}%` }]}
        />
      </View>
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
  /** Ruler shares the same scroll as the wave. @default true */
  showRuler?: boolean;
};

/** Absolute-time ruler — positions are `at * pps`; parent supplies the scroll. */
function RulerRail({
  pps,
  rangeStart,
  rangeEnd,
  contentWidth,
}: {
  pps: number;
  rangeStart: number;
  rangeEnd: number;
  contentWidth: number;
}) {
  const marks = buildLiveWindowRulerMarks(rangeStart, rangeEnd);

  return (
    <View style={[styles.ruler, { width: contentWidth }]}>
      <View style={[styles.rulerLabels, { width: contentWidth }]}>
        {marks
          .filter((mark) => mark.major)
          .map((mark) => (
            <Text
              key={`label-${mark.at}`}
              variant="caption"
              style={[
                styles.rulerLabel,
                {
                  left: mark.at * pps,
                  transform: [{ translateX: mark.at <= 0.01 ? 0 : -13 }],
                },
              ]}>
              {formatLiveWindowTick(mark.at)}
            </Text>
          ))}
      </View>
      <View style={[styles.rulerTrack, { width: contentWidth }]}>
        <View style={styles.rulerBaseline} />
        {marks.map((mark) => (
          <View
            key={`tick-${mark.at}`}
            pointerEvents="none"
            style={[
              styles.rulerTick,
              mark.major ? styles.rulerTickMajor : styles.rulerTickMinor,
              { left: mark.at * pps },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function useLiveMeterBars(
  pps: number,
  scrollX?: { set: (value: number) => void },
  timelineOffsetSeconds = 0,
) {
  const [bars, setBars] = useState<number[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const pendingRef = useRef(0);
  const elapsedRef = useRef(0);
  const ppsRef = useRef(pps);
  const offsetRef = useRef(timelineOffsetSeconds);
  ppsRef.current = pps;
  offsetRef.current = timelineOffsetSeconds;

  useEffect(() => {
    const interval = setInterval(() => {
      const tick = recordingSessionService.getTick();
      const level = normalizeMetering(tick.metering);
      const seconds = tick.durationMillis / 1000;
      const ppsNow = ppsRef.current;
      pendingRef.current = Math.max(pendingRef.current, level);
      if (Math.abs(seconds - elapsedRef.current) >= 0.05) {
        elapsedRef.current = seconds;
        setElapsed(seconds);
      }

      if (scrollX && ppsNow > 0) {
        scrollX.set(
          -followLiveWindowStart(offsetRef.current + seconds) * ppsNow,
        );
      }

      const needed = slotBarCount(liveClipWidthPx(seconds, ppsNow));
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
  }, [scrollX]);

  return { bars, elapsed };
}

/**
 * Live first-take: one translateX scrolls ruler + wave together.
 * Playhead stays fixed in the viewport.
 */
function SharedScrollLiveCapture({
  viewportWidth,
  waveHeight,
  showRuler,
}: {
  viewportWidth: number;
  waveHeight: number;
  showRuler: boolean;
}) {
  const pps = liveWindowPxPerSecond(viewportWidth);
  const scrollX = useSharedValue(0);
  const { bars, elapsed } = useLiveMeterBars(pps, scrollX);

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scrollX.get() }],
  }));

  if (viewportWidth <= 0 || pps <= 0) {
    return null;
  }

  const windowStart = followLiveWindowStart(elapsed);
  const contentWidth =
    Math.max(elapsed, LIVE_WINDOW_SECONDS) * pps + viewportWidth * 0.25;
  const rangeStart = Math.max(0, windowStart - 1);
  const rangeEnd = windowStart + LIVE_WINDOW_SECONDS + 1;
  const waveLeft = windowStart * pps;
  const waveWidth = Math.max(0, elapsed * pps - waveLeft);
  const historySlots = slotBarCount(waveWidth);
  const visibleBars =
    bars.length <= historySlots ? bars : bars.slice(bars.length - historySlots);
  const playheadLeft = playheadLeftInLiveWindow(
    elapsed,
    windowStart,
    viewportWidth,
  );
  const stripHeight = (showRuler ? RULER_HEIGHT : 0) + waveHeight;

  return (
    <View style={{ width: viewportWidth, height: stripHeight, overflow: 'hidden' }}>
      <Animated.View style={[{ width: contentWidth }, contentStyle]}>
        {showRuler ? (
          <RulerRail
            pps={pps}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            contentWidth={contentWidth}
          />
        ) : null}
        <View style={{ height: waveHeight, justifyContent: 'center' }}>
          {waveWidth > 1 && visibleBars.length > 0 ? (
            <View style={{ marginLeft: waveLeft, width: waveWidth }}>
              <StudioPeakWaveform
                peaks={visibleBars}
                height={waveHeight}
                width={waveWidth}
                color="#A078FF"
                fillSlots={false}
                pinBars
                progress={1}
              />
            </View>
          ) : null}
        </View>
      </Animated.View>
      <Playhead left={playheadLeft} topInset={showRuler ? RULER_LABEL_INSET : 0} />
    </View>
  );
}

/**
 * Punch-in: stored take + live extension share one translateX with the ruler.
 */
function SharedScrollPunchIn({
  peaks,
  viewportWidth,
  durationSeconds,
  recordOriginSeconds,
  waveHeight,
  showRuler,
}: {
  peaks: number[];
  viewportWidth: number;
  durationSeconds: number;
  recordOriginSeconds: number;
  waveHeight: number;
  showRuler: boolean;
}) {
  const origin = Math.max(0, recordOriginSeconds);
  const pps = liveWindowPxPerSecond(viewportWidth);
  const scrollX = useSharedValue(0);
  const { bars, elapsed } = useLiveMeterBars(pps, scrollX, origin);

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scrollX.get() }],
  }));

  if (viewportWidth <= 0 || pps <= 0) {
    return null;
  }

  const timelineSeconds = origin + elapsed;
  const windowStart = followLiveWindowStart(timelineSeconds);
  const takeDuration = Math.max(durationSeconds, 0.1);
  const takeWidth = Math.max(1, takeDuration * pps);
  const liveWidth = liveClipWidthPx(elapsed, pps);
  const contentEnd = Math.max(timelineSeconds, takeDuration, LIVE_WINDOW_SECONDS);
  const contentWidth = contentEnd * pps + viewportWidth * 0.25;
  const rangeStart = Math.max(0, windowStart - 1);
  const rangeEnd = windowStart + LIVE_WINDOW_SECONDS + 1;
  const takeProgress = Math.min(1, Math.max(0, timelineSeconds / takeDuration));
  const historySlots = slotBarCount(liveWidth);
  const liveBars =
    bars.length <= historySlots ? bars : bars.slice(bars.length - historySlots);
  const playheadLeft = playheadLeftInLiveWindow(
    timelineSeconds,
    windowStart,
    viewportWidth,
  );
  const stripHeight = (showRuler ? RULER_HEIGHT : 0) + waveHeight;

  return (
    <View style={{ width: viewportWidth, height: stripHeight, overflow: 'hidden' }}>
      <Animated.View style={[{ width: contentWidth }, contentStyle]}>
        {showRuler ? (
          <RulerRail
            pps={pps}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            contentWidth={contentWidth}
          />
        ) : null}
        <View style={{ height: waveHeight, justifyContent: 'center' }}>
          <View style={{ width: takeWidth }}>
            <StudioPeakWaveform
              peaks={peaks}
              height={waveHeight}
              width={takeWidth}
              color="#D0BCFF"
              progress={takeProgress}
            />
          </View>
          {liveWidth > 1 && liveBars.length > 0 ? (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: origin * pps,
                width: liveWidth,
                height: waveHeight,
                justifyContent: 'center',
              }}>
              <StudioPeakWaveform
                peaks={liveBars}
                height={waveHeight}
                width={liveWidth}
                color="#A078FF"
                fillSlots={false}
                pinBars
                progress={1}
              />
            </View>
          ) : null}
        </View>
      </Animated.View>
      <Playhead left={playheadLeft} topInset={showRuler ? RULER_LABEL_INSET : 0} />
    </View>
  );
}

function Playhead({
  left,
  topInset = 0,
}: {
  left: number;
  topInset?: number;
}) {
  return (
    <View
      style={[styles.playhead, { left, top: topInset }]}
      pointerEvents="none">
      <View style={styles.playheadKnob} />
      <View style={styles.playheadLine} />
    </View>
  );
}

/**
 * Stored take: one native scroll moves ruler + wave together.
 */
function ScrollableStoredTake({
  peaks,
  viewportWidth,
  durationSeconds,
  playheadSeconds,
  windowStartSeconds,
  isPlaying,
  waveHeight,
  showRuler,
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
  showRuler: boolean;
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
  const stripHeight = (showRuler ? RULER_HEIGHT : 0) + waveHeight;
  const rangeEnd = Math.max(takeDuration, LIVE_WINDOW_SECONDS);

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

  useEffect(() => {
    if (userScrollingRef.current) {
      return;
    }
    scrollToWindowStart(windowStartSeconds, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync from parent window only
  }, [windowStartSeconds, pps, contentWidth, viewportWidth, durationSeconds]);

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
      style={{ width: viewportWidth, height: stripHeight }}>
      <Pressable
        accessibilityRole="adjustable"
        accessibilityLabel="Waveform. Swipe to scroll, tap to move playhead"
        onPress={(event) => seekFromContentX(event.nativeEvent.locationX)}
        style={{ width: contentWidth }}>
        {showRuler ? (
          <RulerRail
            pps={pps}
            rangeStart={0}
            rangeEnd={rangeEnd}
            contentWidth={contentWidth}
          />
        ) : null}
        <View style={{ height: waveHeight, justifyContent: 'center' }}>
          <View style={{ width: takeWidth }}>
            <StudioPeakWaveform
              peaks={peaks}
              height={waveHeight}
              width={takeWidth}
              color="#D0BCFF"
              progress={takeProgress}
            />
          </View>
        </View>
        <Playhead
          left={Math.max(0, playheadX - 6)}
          topInset={showRuler ? RULER_LABEL_INSET : 0}
        />
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
  showRuler = true,
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
  const stripHeight = (showRuler ? RULER_HEIGHT : 0) + waveHeight;
  const emptyPps = liveWindowPxPerSecond(width);

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
      {showEmpty && width > 0 ? (
        <View style={{ width, height: stripHeight, overflow: 'hidden' }}>
          {showRuler ? (
            <RulerRail
              pps={emptyPps}
              rangeStart={0}
              rangeEnd={LIVE_WINDOW_SECONDS}
              contentWidth={width}
            />
          ) : null}
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
          <Playhead left={0} topInset={showRuler ? RULER_LABEL_INSET : 0} />
        </View>
      ) : null}

      {firstTakeRecording && width > 0 ? (
        <SharedScrollLiveCapture
          viewportWidth={width}
          waveHeight={waveHeight}
          showRuler={showRuler}
        />
      ) : null}

      {punchInRecording && width > 0 ? (
        <SharedScrollPunchIn
          peaks={peaks}
          viewportWidth={width}
          durationSeconds={durationSeconds}
          recordOriginSeconds={recordOriginSeconds}
          waveHeight={waveHeight}
          showRuler={showRuler}
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
          showRuler={showRuler}
          onWindowStartChange={onWindowStartChange}
          onScrubStart={onScrubStart}
          onSeek={onSeek}
          onScrubEnd={onScrubEnd}
        />
      ) : null}
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
  ruler: {
    // Extra vertical padding so Multitrack ruler scrub is easy to hit.
    paddingTop: 8,
    paddingBottom: 10,
  },
  rulerLabels: {
    height: 14,
    marginBottom: 2,
    position: 'relative',
  },
  rulerLabel: {
    position: 'absolute',
    top: 0,
    fontSize: 11,
    lineHeight: 14,
    color: 'rgba(226, 224, 236, 0.88)',
  },
  rulerTrack: {
    height: 10,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  rulerBaseline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
  },
  rulerTick: {
    position: 'absolute',
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    marginLeft: -StyleSheet.hairlineWidth / 2,
    backgroundColor: 'rgba(208, 188, 255, 0.42)',
  },
  rulerTickMajor: {
    height: 8,
    backgroundColor: 'rgba(208, 188, 255, 0.72)',
  },
  rulerTickMinor: {
    height: 4,
  },
  nowCaret: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    borderRadius: 1,
    backgroundColor: '#A078FF',
  },
  playhead: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 8,
    alignItems: 'center',
  },
  playheadKnob: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A078FF',
    boxShadow: '0 0 8px rgba(160, 120, 255, 0.5)',
  },
  playheadLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#A078FF',
    boxShadow: '0 0 8px rgba(160, 120, 255, 0.45)',
  },
});
