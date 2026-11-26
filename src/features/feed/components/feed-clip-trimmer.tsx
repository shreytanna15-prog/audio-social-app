import { useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

const MIN_MS = 10_000;
const MAX_MS = 30_000;
const HANDLE_HIT = 28;
const TRIMMER_HEIGHT = 96;
const BAR_SLOT = 3;
const ACCENT = '#D0BCFF';
const ACCENT_DIM = 'rgba(208, 188, 255, 0.35)';
const BAR_OUT = 'rgba(203, 195, 215, 0.35)';
const BAR_IN = '#D0BCFF';
const PLAYHEAD = '#FFFFFF';

type FeedClipTrimmerProps = {
  peaks: number[];
  trackDurationMs: number;
  startMs: number;
  durationMs: number;
  playheadMs?: number;
  onChange: (next: { startMs: number; durationMs: number }) => void;
};

type DragOrigin = {
  kind: 'move' | 'left' | 'right';
  startMs: number;
  durationMs: number;
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function msToX(ms: number, trackDurationMs: number, width: number): number {
  if (trackDurationMs <= 0 || width <= 0) return 0;
  return (ms / trackDurationMs) * width;
}

function xToMs(x: number, trackDurationMs: number, width: number): number {
  if (trackDurationMs <= 0 || width <= 0) return 0;
  return (x / width) * trackDurationMs;
}

export function FeedClipTrimmer({
  peaks,
  trackDurationMs,
  startMs,
  durationMs,
  playheadMs,
  onChange,
}: FeedClipTrimmerProps) {
  const [width, setWidth] = useState(0);
  const originRef = useRef<DragOrigin | null>(null);
  const startRef = useRef(startMs);
  const durationRef = useRef(durationMs);
  startRef.current = startMs;
  durationRef.current = durationMs;

  const onLayout = (e: LayoutChangeEvent) => {
    const next = Math.round(e.nativeEvent.layout.width);
    setWidth((prev) => (prev === next ? prev : next));
  };

  const endMs = startMs + durationMs;
  const selLeft = msToX(startMs, trackDurationMs, width);
  const selRight = msToX(endMs, trackDurationMs, width);
  const selWidth = Math.max(0, selRight - selLeft);
  const playheadX =
    playheadMs != null ? msToX(playheadMs, trackDurationMs, width) : null;

  const bars = useMemo(() => {
    if (width <= 0 || peaks.length === 0) return [] as { x: number; h: number }[];
    const count = Math.max(1, Math.floor(width / BAR_SLOT));
    const out: { x: number; h: number }[] = [];
    for (let i = 0; i < count; i += 1) {
      const peakIndex = Math.min(
        peaks.length - 1,
        Math.floor((i / count) * peaks.length),
      );
      const amp = Math.max(0.08, Math.min(1, peaks[peakIndex] ?? 0.2));
      out.push({
        x: i * BAR_SLOT + 0.5,
        h: amp * (TRIMMER_HEIGHT - 16),
      });
    }
    return out;
  }, [peaks, width]);

  const beginDrag = (kind: DragOrigin['kind']) => {
    originRef.current = {
      kind,
      startMs: startRef.current,
      durationMs: durationRef.current,
    };
  };

  const applyDrag = (kind: DragOrigin['kind'], translationX: number) => {
    const origin = originRef.current;
    if (width <= 0 || !origin || origin.kind !== kind) return;
    const { startMs: oStart, durationMs: oDur } = origin;
    const deltaMs = xToMs(translationX, trackDurationMs, width);

    if (kind === 'move') {
      const nextStart = clamp(
        oStart + deltaMs,
        0,
        Math.max(0, trackDurationMs - oDur),
      );
      onChange({ startMs: nextStart, durationMs: oDur });
      return;
    }

    if (kind === 'left') {
      const end = oStart + oDur;
      let nextStart = clamp(oStart + deltaMs, 0, end - MIN_MS);
      let nextDur = end - nextStart;
      if (nextDur > MAX_MS) {
        nextStart = end - MAX_MS;
        nextDur = MAX_MS;
      }
      onChange({ startMs: nextStart, durationMs: nextDur });
      return;
    }

    const end = oStart + oDur;
    let nextEnd = clamp(end + deltaMs, oStart + MIN_MS, trackDurationMs);
    let nextDur = nextEnd - oStart;
    if (nextDur > MAX_MS) nextDur = MAX_MS;
    onChange({ startMs: oStart, durationMs: nextDur });
  };

  const endDrag = () => {
    originRef.current = null;
  };

  const moveGesture = Gesture.Pan()
    .onBegin(() => {
      runOnJS(beginDrag)('move');
    })
    .onUpdate((e) => {
      runOnJS(applyDrag)('move', e.translationX);
    })
    .onFinalize(() => {
      runOnJS(endDrag)();
    });

  const leftGesture = Gesture.Pan()
    .onBegin(() => {
      runOnJS(beginDrag)('left');
    })
    .onUpdate((e) => {
      runOnJS(applyDrag)('left', e.translationX);
    })
    .onFinalize(() => {
      runOnJS(endDrag)();
    });

  const rightGesture = Gesture.Pan()
    .onBegin(() => {
      runOnJS(beginDrag)('right');
    })
    .onUpdate((e) => {
      runOnJS(applyDrag)('right', e.translationX);
    })
    .onFinalize(() => {
      runOnJS(endDrag)();
    });

  return (
    <View
      onLayout={onLayout}
      className="overflow-hidden rounded-2xl border border-white/10 bg-surface-container-highest"
      style={{ height: TRIMMER_HEIGHT }}
      accessibilityLabel="Feed clip trimmer"
      accessibilityHint="Drag the highlighted window or its handles to pick a 10 to 30 second clip">
      {width > 0 ? (
        <>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            {bars.map((bar, index) => {
              const mid = bar.x + 0.75;
              const inSel = mid >= selLeft && mid <= selRight;
              return (
                <View
                  key={`bar-${index}`}
                  style={{
                    position: 'absolute',
                    left: bar.x,
                    width: 2,
                    height: bar.h,
                    top: (TRIMMER_HEIGHT - bar.h) / 2,
                    borderRadius: 1,
                    backgroundColor: inSel ? BAR_IN : BAR_OUT,
                  }}
                />
              );
            })}
            <View
              style={{
                position: 'absolute',
                left: selLeft,
                width: selWidth,
                top: 4,
                height: TRIMMER_HEIGHT - 8,
                borderRadius: 10,
                backgroundColor: ACCENT_DIM,
              }}
            />
            <View
              style={{
                position: 'absolute',
                left: selLeft,
                width: 4,
                top: 4,
                height: TRIMMER_HEIGHT - 8,
                borderRadius: 2,
                backgroundColor: ACCENT,
              }}
            />
            <View
              style={{
                position: 'absolute',
                left: selRight - 4,
                width: 4,
                top: 4,
                height: TRIMMER_HEIGHT - 8,
                borderRadius: 2,
                backgroundColor: ACCENT,
              }}
            />
            {playheadX != null &&
            playheadX >= selLeft &&
            playheadX <= selRight ? (
              <View
                style={{
                  position: 'absolute',
                  left: playheadX,
                  width: 2,
                  top: 6,
                  height: TRIMMER_HEIGHT - 12,
                  backgroundColor: PLAYHEAD,
                }}
              />
            ) : null}
          </View>

          <GestureDetector gesture={moveGesture}>
            <View
              style={{
                position: 'absolute',
                left: selLeft + HANDLE_HIT / 2,
                width: Math.max(24, selWidth - HANDLE_HIT),
                top: 0,
                bottom: 0,
              }}
            />
          </GestureDetector>
          <GestureDetector gesture={leftGesture}>
            <View
              style={{
                position: 'absolute',
                left: selLeft - HANDLE_HIT / 2,
                width: HANDLE_HIT,
                top: 0,
                bottom: 0,
              }}
            />
          </GestureDetector>
          <GestureDetector gesture={rightGesture}>
            <View
              style={{
                position: 'absolute',
                left: selRight - HANDLE_HIT / 2,
                width: HANDLE_HIT,
                top: 0,
                bottom: 0,
              }}
            />
          </GestureDetector>
        </>
      ) : null}
    </View>
  );
}
