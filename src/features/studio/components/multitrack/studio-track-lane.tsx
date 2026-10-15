import { memo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { StudioLiveClip } from '@/features/studio/components/multitrack/studio-live-wave';
import { StudioPeakWaveform } from '@/features/studio/components/multitrack/studio-peak-waveform';
import { useCaptureElapsed } from '@/features/audio/hooks/use-capture-elapsed';
import type { ProjectLayer } from '@/features/audio/types/project';
import { formatDuration } from '@/features/audio/utils/format';

/** The header column is excluded from the scrub surface, so the stack shares it. */
export const LANE_HEADER_WIDTH = 124;
export const LANE_WAVE_HEIGHT = 76;

const LAYER_COLORS: Record<ProjectLayer['kind'], string> = {
  vocal: '#1A73E8',
  beat: '#7C4DFF',
  import: '#00897B',
};

type StudioTrackLaneHeaderProps = {
  layer: ProjectLayer;
  selected: boolean;
  canEdit: boolean;
  live: boolean;
  onSelect: (layerId: string) => void;
  onToggleMute: (layerId: string) => void;
  onRemove: (layerId: string) => void;
};

function LiveDurationLabel({ baseSeconds }: { baseSeconds: number }) {
  const elapsed = useCaptureElapsed(true);
  return <Text>{formatDuration(baseSeconds + elapsed)}</Text>;
}

function StudioTrackLaneHeaderComponent({
  layer,
  selected,
  canEdit,
  live,
  onSelect,
  onToggleMute,
  onRemove,
}: StudioTrackLaneHeaderProps) {
  const color = LAYER_COLORS[layer.kind];

  return (
    <Pressable
      onPress={() => onSelect(layer.id)}
      style={[styles.header, selected && styles.headerSelected]}
      accessibilityRole="button"
      accessibilityLabel={`Select ${layer.name}`}>
      <View style={[styles.kindDot, { backgroundColor: color }]} />
      <Text style={[styles.name, selected && styles.nameSelected]} numberOfLines={1}>
        {layer.name}
      </Text>
      <Text style={styles.duration}>
        {live && !layer.stemUri ? (
          <LiveDurationLabel baseSeconds={0} />
        ) : (
          formatDuration(layer.durationSeconds)
        )}
      </Text>
      <View style={styles.actions}>
        <Pressable
          onPress={() => onToggleMute(layer.id)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={layer.muted ? `Unmute ${layer.name}` : `Mute ${layer.name}`}
          style={styles.iconButton}>
          <SymbolView
            name={
              layer.muted
                ? { ios: 'speaker.slash.fill', android: 'volume_off', web: 'volume_off' }
                : { ios: 'speaker.wave.2.fill', android: 'volume_up', web: 'volume_up' }
            }
            size={17}
            tintColor={layer.muted ? '#9AA1A9' : '#1A1D21'}
          />
        </Pressable>
        <Pressable
          onPress={() => onRemove(layer.id)}
          disabled={!canEdit}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${layer.name}`}
          style={[styles.iconButton, !canEdit && styles.iconDisabled]}>
          <SymbolView
            name={{ ios: 'trash', android: 'delete_outline', web: 'delete_outline' }}
            size={17}
            tintColor="#C62828"
          />
        </Pressable>
      </View>
    </Pressable>
  );
}

type StudioTrackLaneWaveProps = {
  layer: ProjectLayer;
  selected: boolean;
  progress: number;
  offsetWidth: number;
  clipWidth: number;
  liveOffsetWidth: number;
  pps: number;
  contentWidth: number;
  cleaning: boolean;
  live: boolean;
  captureActive: boolean;
};

function StudioTrackLaneWaveComponent({
  layer,
  selected,
  progress,
  offsetWidth,
  clipWidth,
  liveOffsetWidth,
  pps,
  contentWidth,
  cleaning,
  live,
  captureActive,
}: StudioTrackLaneWaveProps) {
  const color = LAYER_COLORS[layer.kind];
  const hasStem = Boolean(layer.stemUri);
  const isEmpty = !hasStem && !live;
  const prefixWidth = live
    ? Math.max(0, Math.min(clipWidth, liveOffsetWidth - offsetWidth))
    : clipWidth;
  const leadWidth = hasStem ? offsetWidth : live ? liveOffsetWidth : offsetWidth;
  const joinGap =
    live && hasStem ? Math.max(0, liveOffsetWidth - offsetWidth - prefixWidth) : 0;
  const tailWidth = live ? 0 : Math.max(0, contentWidth - offsetWidth - clipWidth);

  return (
    <View style={[styles.wave, selected && styles.waveSelected, { width: contentWidth }]}>
      {isEmpty ? (
        <Text style={styles.emptyLabel}>Empty — tap Rec to fill this layer</Text>
      ) : (
        <View style={styles.timelineRow}>
          {leadWidth > 0 ? <View style={{ width: leadWidth }} /> : null}
          {hasStem && prefixWidth > 0 ? (
            <View style={[styles.prefixClip, { width: prefixWidth }]}>
              <StudioPeakWaveform
                peaks={layer.peaks}
                height={LANE_WAVE_HEIGHT - 16}
                width={clipWidth}
                color={color}
                progress={1}
                dimmed={layer.muted}
                pinBars={layer.kind === 'vocal'}
              />
            </View>
          ) : null}
          {joinGap > 0 ? <View style={{ width: joinGap }} /> : null}
          {live ? (
            <StudioLiveClip
              color={color}
              waveHeight={LANE_WAVE_HEIGHT - 16}
              captureActive={captureActive}
              pps={pps}
              stemOffsetWidth={offsetWidth}
              stemClipWidth={clipWidth}
              liveOffsetWidth={liveOffsetWidth}
              stemPeaks={layer.peaks}
              stemDimmed={layer.muted}
              pinStemBars={layer.kind === 'vocal'}
            />
          ) : tailWidth > 0 ? (
            <View style={[styles.tailSegment, { width: tailWidth }]}>
              <View style={[styles.tailLine, layer.muted && styles.tailLineDimmed]} />
            </View>
          ) : null}
        </View>
      )}

      {cleaning ? (
        <View style={styles.cleaningBadge} pointerEvents="none">
          <ActivityIndicator size="small" color="#1A73E8" />
          <Text style={styles.cleaningLabel}>Cleaning…</Text>
        </View>
      ) : null}
    </View>
  );
}

export const StudioTrackLaneHeader = memo(StudioTrackLaneHeaderComponent);
export const StudioTrackLaneWave = memo(StudioTrackLaneWaveComponent);

const styles = StyleSheet.create({
  header: {
    width: LANE_HEADER_WIDTH,
    height: LANE_WAVE_HEIGHT,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
    justifyContent: 'center',
    gap: 2,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#E2E6EB',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E6EB',
    backgroundColor: '#FFFFFF',
  },
  headerSelected: {
    backgroundColor: '#E8F1FC',
  },
  kindDot: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5F6368',
  },
  nameSelected: {
    color: '#1A1D21',
  },
  duration: {
    marginTop: 2,
    fontSize: 11,
    color: '#9AA1A9',
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    marginTop: 6,
    marginLeft: -6,
    gap: 4,
  },
  iconButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  iconDisabled: {
    opacity: 0.3,
  },
  wave: {
    height: LANE_WAVE_HEIGHT,
    justifyContent: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E6EB',
    backgroundColor: '#FFFFFF',
  },
  waveSelected: {
    backgroundColor: '#F3F8FE',
  },
  timelineRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefixClip: {
    overflow: 'hidden',
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
  emptyLabel: {
    fontSize: 11,
    color: '#9AA1A9',
    paddingLeft: 10,
  },
  cleaningBadge: {
    position: 'absolute',
    right: 8,
    top: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  cleaningLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1A73E8',
  },
});
