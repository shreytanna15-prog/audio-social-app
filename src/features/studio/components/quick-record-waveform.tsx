import { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { normalizeMetering } from '@/features/audio/domain/recorder-session.helpers';
import { liveClipWidthPx, slotBarCount } from '@/features/audio/domain/timeline';
import { useCaptureElapsed } from '@/features/audio/hooks/use-capture-elapsed';
import { recordingSessionService } from '@/features/audio/services/recording-session.service';
import { StudioPeakWaveform } from '@/features/studio/components/multitrack/studio-peak-waveform';
import { Text } from '@/shared/components/ui/text';

/** Visible time span across the waveform viewport (constant scale). */
export const LIVE_WINDOW_SECONDS = 30;
/** Grow from the left until this fraction of the window, then scroll (record/play follow). */
const FOLLOW_RATIO = 0.8;
const FOLLOW_LEAD_SECONDS = LIVE_WINDOW_SECONDS * FOLLOW_RATIO;
/** Soft edge band for scrub/play autoscroll — not full playhead-follow. */
const EDGE_RATIO = 0.12;
const EDGE_SECONDS = LIVE_WINDOW_SECONDS * EDGE_RATIO;
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

function maxWindowStart(durationSeconds: number): number {
  return Math.max(0, durationSeconds - LIVE_WINDOW_SECONDS);
}

function clampWindowStart(start: number, durationSeconds: number): number {
  return Math.max(0, Math.min(start, maxWindowStart(durationSeconds)));
}

/** Record / first-take: keep head near 80% once past the lead. */
function followWindowStart(playheadSeconds: number): number {
  const playhead = Math.max(0, playheadSeconds);
  if (playhead < FOLLOW_LEAD_SECONDS) {
    return 0;
  }
  return playhead - FOLLOW_LEAD_SECONDS;
}

/**
 * Keep the playhead inside the viewport; only nudge when it hits an edge.
 * Does not continuously re-center — scrub stays still until the edge.
 */
function edgeEnsureWindowStart(
  playheadSeconds: number,
  windowStart: number,
  durationSeconds: number,
): number {
  const playhead = Math.max(0, playheadSeconds);
  const windowEnd = windowStart + LIVE_WINDOW_SECONDS;
  let next = windowStart;

  if (playhead < windowStart + EDGE_SECONDS) {
    next = playhead - EDGE_SECONDS;
  } else if (playhead > windowEnd - EDGE_SECONDS) {
    next = playhead - (LIVE_WINDOW_SECONDS - EDGE_SECONDS);
  }

  return clampWindowStart(next, durationSeconds);
}

function playheadLeftInWindow(
  playheadSeconds: number,
  windowStart: number,
  viewportWidth: number,
): number {
  if (viewportWidth <= 0) {
    return 0;
  }
  const pps = viewportWidth / LIVE_WINDOW_SECONDS;
  return Math.max(0, (playheadSeconds - windowStart) * pps - 6);
}

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
    ? followWindowStart(timelineSeconds)
    : Math.max(0, windowStartSeconds);
  const windowEnd = windowStart + LIVE_WINDOW_SECONDS;
  const ticks = buildTicks(windowStart, windowEnd);

  return (
    <View className="flex-row justify-between px-1 pt-1">
      {ticks.map((at, index) => (
        <Text
          key={`tick-${index}-${Math.floor(at * 10) / 10}`}
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
};

function LiveMeterWave({ viewportWidth }: { viewportWidth: number }) {
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
  const windowStart = followWindowStart(elapsed);
  const playheadLeft = playheadLeftInWindow(elapsed, windowStart, viewportWidth);

  return (
    <>
      <LiveMeterWave viewportWidth={viewportWidth} />
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
}: {
  peaks: number[];
  viewportWidth: number;
  durationSeconds: number;
  playheadSeconds: number;
  windowStart: number;
  showPlayhead?: boolean;
}) {
  const takeDuration = Math.max(durationSeconds, 0.1);
  const playhead = Math.max(0, playheadSeconds);
  const pps = viewportWidth / LIVE_WINDOW_SECONDS;
  const takeStartX = (0 - windowStart) * pps;
  const takeWidth = Math.max(1, takeDuration * pps);
  const takeProgress = Math.min(1, Math.max(0, playhead / takeDuration));
  const playheadLeft = playheadLeftInWindow(playhead, windowStart, viewportWidth);

  return (
    <>
      <View style={{ width: viewportWidth, overflow: 'hidden' }}>
        <View style={{ marginLeft: takeStartX, width: takeWidth }}>
          <StudioPeakWaveform
            peaks={peaks}
            height={WAVE_HEIGHT}
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
}: {
  viewportWidth: number;
  windowStart: number;
  originSeconds: number;
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
        height: WAVE_HEIGHT,
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
      <StudioPeakWaveform
        peaks={visibleBars.length > 0 ? visibleBars : fullBars}
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

function PunchInLiveCapture({
  peaks,
  viewportWidth,
  durationSeconds,
  recordOriginSeconds,
}: {
  peaks: number[];
  viewportWidth: number;
  durationSeconds: number;
  recordOriginSeconds: number;
}) {
  const elapsed = useCaptureElapsed(true);
  const origin = Math.max(0, recordOriginSeconds);
  const timelineSeconds = origin + elapsed;
  // Local follow only — never push 10Hz window updates to parent state.
  const windowStart = followWindowStart(timelineSeconds);
  const playheadLeft = playheadLeftInWindow(
    timelineSeconds,
    windowStart,
    viewportWidth,
  );

  return (
    <View style={{ width: viewportWidth, height: WAVE_HEIGHT, justifyContent: 'center' }}>
      <StoredTakeWave
        peaks={peaks}
        viewportWidth={viewportWidth}
        durationSeconds={durationSeconds}
        playheadSeconds={timelineSeconds}
        windowStart={windowStart}
        showPlayhead={false}
      />
      <PunchInLiveMeter
        viewportWidth={viewportWidth}
        windowStart={windowStart}
        originSeconds={origin}
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
}: QuickRecordWaveformProps) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  widthRef.current = width;
  const [scrubSeconds, setScrubSeconds] = useState<number | null>(null);
  const lastScrubSecondsRef = useRef(0);
  const windowStartRef = useRef(windowStartSeconds);
  const scrubbingRef = useRef(false);
  const onWindowStartChangeRef = useRef(onWindowStartChange);
  onWindowStartChangeRef.current = onWindowStartChange;

  windowStartRef.current = windowStartSeconds;

  const emitWindowStart = (next: number) => {
    const clamped = clampWindowStart(next, durationSeconds);
    if (Math.abs(clamped - windowStartRef.current) < 0.001) {
      return;
    }
    windowStartRef.current = clamped;
    onWindowStartChangeRef.current?.(clamped);
  };

  const onLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    setWidth((prev) => (prev === next ? prev : next));
  };

  const showEmpty = !isRecording && !hasTake;
  const punchInRecording = isRecording && hasTake;
  const firstTakeRecording = isRecording && !hasTake;
  const scrubEnabled =
    Boolean(onSeek || onScrubEnd) &&
    !isRecording &&
    hasTake &&
    durationSeconds > 0;

  const idlePlayheadSeconds =
    scrubSeconds != null
      ? scrubSeconds
      : Math.max(0, progress) * Math.max(durationSeconds, 0);

  // After recording stops, snap idle window so the playhead is visible once.
  const wasRecordingRef = useRef(isRecording);
  useEffect(() => {
    const wasRecording = wasRecordingRef.current;
    wasRecordingRef.current = isRecording;
    if (wasRecording && !isRecording && hasTake && durationSeconds > 0) {
      emitWindowStart(
        edgeEnsureWindowStart(
          idlePlayheadSeconds,
          windowStartRef.current,
          durationSeconds,
        ),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot on record stop
  }, [isRecording]);

  // Playback: nudge window only when the playhead hits an edge (not while scrubbing).
  // Also jump-scroll if the playhead is fully off-screen (e.g. after punch-in seek).
  useEffect(() => {
    if (isRecording || scrubbingRef.current || !hasTake || durationSeconds <= 0) {
      return;
    }
    if (scrubSeconds != null) {
      return;
    }

    const start = windowStartRef.current;
    const end = start + LIVE_WINDOW_SECONDS;
    const outside = idlePlayheadSeconds < start || idlePlayheadSeconds > end;
    if (!isPlaying && !outside) {
      return;
    }

    emitWindowStart(
      edgeEnsureWindowStart(
        idlePlayheadSeconds,
        windowStartRef.current,
        durationSeconds,
      ),
    );
    // emitWindowStart reads refs; deps are the signals that matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    durationSeconds,
    hasTake,
    idlePlayheadSeconds,
    isPlaying,
    isRecording,
    scrubSeconds,
  ]);

  // Keep window valid when take length changes.
  useEffect(() => {
    if (durationSeconds <= 0) {
      return;
    }
    emitWindowStart(clampWindowStart(windowStartRef.current, durationSeconds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationSeconds]);

  const setWindowStart = (next: number) => {
    emitWindowStart(next);
  };

  const secondsFromX = (locationX: number): number | null => {
    if (durationSeconds <= 0 || widthRef.current <= 0) {
      return null;
    }
    const ratio = Math.min(1, Math.max(0, locationX / widthRef.current));
    const seconds =
      windowStartRef.current + ratio * LIVE_WINDOW_SECONDS;
    return Math.min(durationSeconds, Math.max(0, seconds));
  };

  const scrubFromX = (locationX: number) => {
    const seconds = secondsFromX(locationX);
    if (seconds == null) {
      return;
    }
    lastScrubSecondsRef.current = seconds;
    setScrubSeconds(seconds);
    // Edge-only autoscroll — viewport stays still until the bar hits a side.
    const nextWindow = edgeEnsureWindowStart(
      seconds,
      windowStartRef.current,
      durationSeconds,
    );
    if (Math.abs(nextWindow - windowStartRef.current) > 0.001) {
      setWindowStart(nextWindow);
    }
    onSeek?.(seconds);
  };

  const finishScrub = () => {
    scrubbingRef.current = false;
    const seconds = lastScrubSecondsRef.current;
    setScrubSeconds(null);
    onScrubEnd?.(seconds);
  };

  return (
    <View
      className="relative flex-1 justify-center"
      onLayout={onLayout}
      onStartShouldSetResponder={() => scrubEnabled}
      onMoveShouldSetResponder={() => scrubEnabled}
      onResponderGrant={(event) => {
        scrubbingRef.current = true;
        onScrubStart?.();
        scrubFromX(event.nativeEvent.locationX);
      }}
      onResponderMove={(event) => scrubFromX(event.nativeEvent.locationX)}
      onResponderRelease={finishScrub}
      onResponderTerminate={finishScrub}>
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

      {firstTakeRecording && width > 0 ? (
        <QuickRecordLiveCapture viewportWidth={width} />
      ) : null}

      {punchInRecording && width > 0 ? (
        <PunchInLiveCapture
          peaks={peaks}
          viewportWidth={width}
          durationSeconds={durationSeconds}
          recordOriginSeconds={recordOriginSeconds}
        />
      ) : null}

      {!isRecording && hasTake && width > 0 ? (
        <StoredTakeWave
          peaks={peaks}
          viewportWidth={width}
          durationSeconds={durationSeconds}
          playheadSeconds={idlePlayheadSeconds}
          windowStart={windowStartSeconds}
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
