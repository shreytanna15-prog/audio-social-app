import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  LANE_HEADER_WIDTH,
  LANE_WAVE_HEIGHT,
  StudioTrackLaneHeader,
  StudioTrackLaneWave,
} from '@/features/audio/components/studio/studio-track-lane';
import {
  RULER_HEIGHT,
  RULER_MAJOR_SECONDS,
  TIMELINE_WINDOW_SECONDS,
  clipOffsetPx,
  clipWidthPx,
  exactClipWidthPx,
  playheadX,
  pxPerSecond,
  secondsFromTimelineX,
  timelineContentWidth,
  timelineOriginPx,
} from '@/features/audio/domain/timeline';
import { useCaptureElapsed } from '@/features/audio/hooks/use-capture-elapsed';
import type { ProjectLayer } from '@/features/audio/types/project';
import { formatDuration } from '@/features/audio/utils/format';

const FOLLOW_RATIO = 0.3;
const FOLLOW_EDGE_PX = 24;
/** One extra screen of empty timeline so Rec can walk without resizing every tick. */
const REC_HEADROOM_SECONDS = TIMELINE_WINDOW_SECONDS;

function formatRulerLabel(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  if (minutes === 0) {
    return `${seconds}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function StudioRulerClock({
  isRecording,
  recordOriginSeconds,
  currentTime,
}: {
  isRecording: boolean;
  recordOriginSeconds: number;
  currentTime: number;
}) {
  const elapsed = useCaptureElapsed(isRecording);
  const displayTime = isRecording ? recordOriginSeconds + elapsed : currentTime;

  return (
    <View style={styles.rulerClock}>
      <Text style={styles.rulerClockLabel}>{formatDuration(displayTime)}</Text>
    </View>
  );
}

function StudioTimeRuler({
  width,
  originPx,
  durationSeconds,
  pps,
}: {
  width: number;
  originPx: number;
  durationSeconds: number;
  pps: number;
}) {
  const span = Math.max(durationSeconds, Math.max(0, (width - originPx) / Math.max(1e-6, pps)));
  const major = RULER_MAJOR_SECONDS;
  const marks: { at: number; major: boolean }[] = [];

  for (let at = 0; at <= span + 0.001; at += 1) {
    const isMajor = at % major === 0;
    if (isMajor || at % 1 === 0) {
      marks.push({ at, major: isMajor });
    }
  }

  return (
    <View style={[styles.ruler, { width }]}>
      {marks.map((mark) => {
        const left = originPx + mark.at * pps;
        return (
          <View
            key={`tick-${mark.at}-${mark.major ? 'm' : 'n'}`}
            style={[styles.rulerTickWrap, { left }]}
            pointerEvents="none">
            <View style={mark.major ? styles.rulerTickMajor : styles.rulerTickMinor} />
            {mark.major ? (
              <Text style={styles.rulerTickLabel}>{formatRulerLabel(mark.at)}</Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function StudioPlayhead({
  isRecording,
  recordOriginSeconds,
  currentTime,
  originPx,
  pps,
  followPlayhead,
  scrollRef,
  viewportWidthRef,
  scrollXRef,
}: {
  isRecording: boolean;
  recordOriginSeconds: number;
  currentTime: number;
  originPx: number;
  pps: number;
  followPlayhead: boolean;
  scrollRef: RefObject<ScrollView | null>;
  viewportWidthRef: RefObject<number>;
  scrollXRef: RefObject<number>;
}) {
  const elapsed = useCaptureElapsed(isRecording);
  const displayTime = isRecording ? recordOriginSeconds + elapsed : currentTime;
  const x = playheadX(displayTime, originPx, pps);

  useEffect(() => {
    if (!followPlayhead) {
      return;
    }

    const viewport = viewportWidthRef.current;
    if (viewport <= 0) {
      return;
    }

    const left = scrollXRef.current;
    const right = left + viewport;
    if (x >= left + FOLLOW_EDGE_PX && x <= right - FOLLOW_EDGE_PX) {
      return;
    }

    scrollRef.current?.scrollTo({
      x: Math.max(0, x - viewport * FOLLOW_RATIO),
      animated: false,
    });
  }, [followPlayhead, scrollRef, scrollXRef, viewportWidthRef, x]);

  return (
    <View style={[styles.playhead, { left: x }]} pointerEvents="none">
      <View style={styles.playheadKnob} />
      <View style={styles.playheadLine} />
    </View>
  );
}

type StudioTrackStackProps = {
  layers: ProjectLayer[];
  selectedLayerId: string | null;
  currentTime: number;
  durationSeconds: number;
  liveLayerId: string | null;
  liveOffsetMs: number;
  recordOriginSeconds: number;
  isRecording: boolean;
  followPlayhead: boolean;
  canEdit: boolean;
  /** Layers whose soft gate is still running in the background. */
  cleaningLayerIds: string[];
  importingLabel: string | null;
  onSelect: (layerId: string) => void;
  onToggleMute: (layerId: string) => void;
  onRemove: (layerId: string) => void;
  onScrub: (seconds: number) => void;
};

export function StudioTrackStack({
  layers,
  selectedLayerId,
  currentTime,
  durationSeconds,
  liveLayerId,
  liveOffsetMs,
  recordOriginSeconds,
  isRecording,
  followPlayhead,
  canEdit,
  cleaningLayerIds,
  importingLabel,
  onSelect,
  onToggleMute,
  onRemove,
  onScrub,
}: StudioTrackStackProps) {
  const scrollRef = useRef<ScrollView>(null);
  const viewportWidthRef = useRef(0);
  const scrollXRef = useRef(0);
  const durationRef = useRef(durationSeconds);
  const onScrubRef = useRef(onScrub);
  onScrubRef.current = onScrub;
  const [viewportWidth, setViewportWidth] = useState(0);
  const timelineSeconds = isRecording
    ? Math.max(durationSeconds, recordOriginSeconds + REC_HEADROOM_SECONDS)
    : durationSeconds;
  durationRef.current = timelineSeconds;

  const originPx = timelineOriginPx(viewportWidth);
  const pps = pxPerSecond(viewportWidth);
  const contentWidth = timelineContentWidth(timelineSeconds, viewportWidth, pps);
  const originRef = useRef(originPx);
  const ppsRef = useRef(pps);
  originRef.current = originPx;
  ppsRef.current = pps;

  const seekFromContentX = useCallback((x: number) => {
    onScrubRef.current(
      secondsFromTimelineX(x, durationRef.current, originRef.current, ppsRef.current),
    );
  }, []);

  const hasLanes = layers.length > 0 || importingLabel != null;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {hasLanes ? (
          <View style={styles.lanesRow}>
            <View style={styles.headerColumn}>
              <StudioRulerClock
                isRecording={isRecording}
                recordOriginSeconds={recordOriginSeconds}
                currentTime={currentTime}
              />
              {layers.map((layer) => (
                <StudioTrackLaneHeader
                  key={layer.id}
                  layer={layer}
                  selected={layer.id === selectedLayerId}
                  canEdit={canEdit}
                  live={layer.id === liveLayerId}
                  onSelect={onSelect}
                  onToggleMute={onToggleMute}
                  onRemove={onRemove}
                />
              ))}

              {importingLabel ? (
                <View style={styles.pendingHeader}>
                  <ActivityIndicator size="small" color="#1A73E8" />
                </View>
              ) : null}
            </View>

            <ScrollView
              ref={scrollRef}
              horizontal
              nestedScrollEnabled
              directionalLockEnabled
              showsHorizontalScrollIndicator={false}
              bounces={false}
              style={styles.waveScroll}
              onLayout={(event) => {
                const width = event.nativeEvent.layout.width;
                viewportWidthRef.current = width;
                setViewportWidth((previous) => (previous === width ? previous : width));
              }}
              onScroll={(event) => {
                scrollXRef.current = event.nativeEvent.contentOffset.x;
              }}
              scrollEventThrottle={16}>
              <Pressable
                onPress={(event) => seekFromContentX(event.nativeEvent.locationX)}
                style={{ width: contentWidth }}>
                <StudioTimeRuler
                  width={contentWidth}
                  originPx={originPx}
                  durationSeconds={timelineSeconds}
                  pps={pps}
                />
                {layers.map((layer) => {
                  const live = layer.id === liveLayerId;
                  const offsetWidth = clipOffsetPx(layer.offsetMs, originPx, pps);
                  const clipWidth = live
                    ? exactClipWidthPx(layer.durationSeconds, pps)
                    : clipWidthPx(layer.durationSeconds, pps);
                  const liveOffsetWidth = clipOffsetPx(liveOffsetMs, originPx, pps);
                  const offsetSeconds = layer.offsetMs / 1000;
                  const clipProgress =
                    isRecording || layer.durationSeconds <= 0
                      ? 0
                      : Math.min(
                          1,
                          Math.max(0, (currentTime - offsetSeconds) / layer.durationSeconds),
                        );
                  const snappedProgress = Math.round(clipProgress * 32) / 32;

                  return (
                    <StudioTrackLaneWave
                      key={layer.id}
                      layer={layer}
                      selected={layer.id === selectedLayerId}
                      progress={layer.stemUri || live ? snappedProgress : 0}
                      offsetWidth={offsetWidth}
                      clipWidth={clipWidth}
                      liveOffsetWidth={liveOffsetWidth}
                      pps={pps}
                      contentWidth={contentWidth}
                      cleaning={cleaningLayerIds.includes(layer.id)}
                      live={live}
                      captureActive={isRecording}
                    />
                  );
                })}

                {importingLabel ? (
                  <View style={[styles.pendingWave, { width: contentWidth }]}>
                    <Text style={styles.pendingLabel}>{importingLabel}</Text>
                  </View>
                ) : null}

                <StudioPlayhead
                  isRecording={isRecording}
                  recordOriginSeconds={recordOriginSeconds}
                  currentTime={currentTime}
                  originPx={originPx}
                  pps={pps}
                  followPlayhead={followPlayhead}
                  scrollRef={scrollRef}
                  viewportWidthRef={viewportWidthRef}
                  scrollXRef={scrollXRef}
                />
              </Pressable>
            </ScrollView>
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No layers yet</Text>
            <Text style={styles.emptyHint}>
              Tap Rec for Vocals 1, or + Beat to import a beat.
            </Text>
          </View>
        )}
      </View>

      {hasLanes ? (
        <Text style={styles.scrubHint}>Swipe to scroll. Tap a wave to move the playhead.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  rulerClock: {
    width: LANE_HEADER_WIDTH,
    height: RULER_HEIGHT,
    justifyContent: 'center',
    paddingLeft: 12,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#E2E6EB',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E6EB',
    backgroundColor: '#FFFFFF',
  },
  rulerClockLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1D21',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  ruler: {
    height: RULER_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E6EB',
    overflow: 'hidden',
  },
  rulerTickWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 40,
    marginLeft: -1,
    alignItems: 'flex-start',
    paddingTop: 4,
  },
  rulerTickMajor: {
    width: 1.5,
    height: 12,
    backgroundColor: '#5F6368',
  },
  rulerTickMinor: {
    width: 1,
    height: 6,
    backgroundColor: '#C5CAD3',
  },
  rulerTickLabel: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '600',
    color: '#7A7F87',
    fontVariant: ['tabular-nums'],
  },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderCurve: 'continuous',
  },
  lanesRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  headerColumn: {
    width: LANE_HEADER_WIDTH,
    zIndex: 1,
  },
  waveScroll: {
    flex: 1,
  },
  playhead: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    alignItems: 'center',
  },
  playheadKnob: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E53935',
  },
  playheadLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E53935',
  },
  pendingHeader: {
    width: LANE_HEADER_WIDTH,
    height: LANE_WAVE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#E2E6EB',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E6EB',
    backgroundColor: '#FFFFFF',
  },
  pendingWave: {
    height: LANE_WAVE_HEIGHT,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E6EB',
  },
  pendingLabel: {
    paddingLeft: 12,
    fontSize: 12,
    color: '#7A7F87',
  },
  empty: {
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1D21',
  },
  emptyHint: {
    fontSize: 13,
    color: '#7A7F87',
    textAlign: 'center',
  },
  scrubHint: {
    fontSize: 11,
    color: '#9AA1A9',
    textAlign: 'center',
  },
});
