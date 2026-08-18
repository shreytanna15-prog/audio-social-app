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
  clipOffsetPx,
  clipWidthPx,
  playheadX,
  secondsFromTimelineX,
  timelineContentWidth,
} from '@/features/audio/domain/timeline';
import { useCaptureElapsed } from '@/features/audio/hooks/use-capture-elapsed';
import type { ProjectLayer } from '@/features/audio/types/project';
import { formatDuration } from '@/features/audio/utils/format';

const FOLLOW_RATIO = 0.3;
const FOLLOW_EDGE_PX = 24;
/** Extra timeline while Rec is on so the pole can walk without a 10 Hz width update. */
const REC_HEADROOM_SECONDS = 180;

function StudioTimeRow({
  isRecording,
  recordOriginSeconds,
  currentTime,
  durationSeconds,
}: {
  isRecording: boolean;
  recordOriginSeconds: number;
  currentTime: number;
  durationSeconds: number;
}) {
  const elapsed = useCaptureElapsed(isRecording);
  const displayTime = isRecording ? recordOriginSeconds + elapsed : currentTime;
  const displayDuration = Math.max(durationSeconds, displayTime);

  return (
    <View style={styles.timeRow}>
      <Text style={styles.timeNow}>{formatDuration(displayTime)}</Text>
      <Text style={styles.timeTotal}>{formatDuration(displayDuration)}</Text>
    </View>
  );
}

function StudioPlayhead({
  isRecording,
  recordOriginSeconds,
  currentTime,
  followPlayhead,
  scrollRef,
  viewportWidthRef,
  scrollXRef,
}: {
  isRecording: boolean;
  recordOriginSeconds: number;
  currentTime: number;
  followPlayhead: boolean;
  scrollRef: RefObject<ScrollView | null>;
  viewportWidthRef: RefObject<number>;
  scrollXRef: RefObject<number>;
}) {
  const elapsed = useCaptureElapsed(isRecording);
  const displayTime = isRecording ? recordOriginSeconds + elapsed : currentTime;
  const x = playheadX(displayTime);

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

  const contentWidth = timelineContentWidth(timelineSeconds, viewportWidth);

  const seekFromContentX = useCallback((x: number) => {
    onScrubRef.current(secondsFromTimelineX(x, durationRef.current));
  }, []);

  const hasLanes = layers.length > 0 || importingLabel != null;

  return (
    <View style={styles.container}>
      <StudioTimeRow
        isRecording={isRecording}
        recordOriginSeconds={recordOriginSeconds}
        currentTime={currentTime}
        durationSeconds={durationSeconds}
      />

      <View style={styles.card}>
        {hasLanes ? (
          <View style={styles.lanesRow}>
            <View style={styles.headerColumn}>
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
                {layers.map((layer) => {
                  const live = layer.id === liveLayerId;
                  const offsetWidth = live
                    ? clipOffsetPx(liveOffsetMs)
                    : clipOffsetPx(layer.offsetMs);
                  const clipWidth = live ? 0 : clipWidthPx(layer.durationSeconds);
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
                      contentWidth={contentWidth}
                      cleaning={cleaningLayerIds.includes(layer.id)}
                      live={live}
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
              Tap Rec to record Vocals 1, or Add Beat to bring in a track.
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
    gap: 6,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 2,
  },
  timeNow: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1D21',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  timeTotal: {
    fontSize: 13,
    color: '#7A7F87',
    fontVariant: ['tabular-nums'],
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E0E4EA',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
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
    borderRightColor: '#E6E9EE',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E9EE',
    backgroundColor: '#F7F9FC',
  },
  pendingWave: {
    height: LANE_WAVE_HEIGHT,
    justifyContent: 'center',
    backgroundColor: '#F7F9FC',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E9EE',
  },
  pendingLabel: {
    paddingLeft: 12,
    fontSize: 12,
    color: '#5F6368',
  },
  empty: {
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 28,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3C4043',
  },
  emptyHint: {
    fontSize: 12,
    color: '#7A7F87',
    textAlign: 'center',
  },
  scrubHint: {
    fontSize: 11,
    color: '#9AA1A9',
    textAlign: 'center',
  },
});
