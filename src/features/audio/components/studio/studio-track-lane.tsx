import { memo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { StudioLiveClip } from '@/features/audio/components/studio/studio-live-wave';
import { StudioPeakWaveform } from '@/features/audio/components/studio/studio-peak-waveform';
import { useCaptureElapsed } from '@/features/audio/hooks/use-capture-elapsed';
import type { ProjectLayer } from '@/features/audio/types/project';
import { formatDuration } from '@/features/audio/utils/format';

/** The header column is excluded from the scrub surface, so the stack shares it. */
export const LANE_HEADER_WIDTH = 108;
export const LANE_WAVE_HEIGHT = 64;

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

function LiveDurationLabel() {
  const elapsed = useCaptureElapsed(true);
  return <Text>{formatDuration(elapsed)}</Text>;
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
      <Text style={[styles.duration, selected && styles.durationSelected]}>
        {live ? <LiveDurationLabel /> : formatDuration(layer.durationSeconds)}
      </Text>

      <View style={styles.actions}>
        <Pressable
          onPress={() => onToggleMute(layer.id)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={layer.muted ? `Unmute ${layer.name}` : `Mute ${layer.name}`}
          style={styles.iconButton}>
          <SymbolView
            name={
              layer.muted
                ? { ios: 'speaker.slash.fill', android: 'volume_off', web: 'volume_off' }
                : { ios: 'speaker.wave.2.fill', android: 'volume_up', web: 'volume_up' }
            }
            size={15}
            tintColor={layer.muted ? '#9AA1A9' : '#3C4043'}
          />
        </Pressable>
        <Pressable
          onPress={() => onRemove(layer.id)}
          disabled={!canEdit}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${layer.name}`}
          style={[styles.iconButton, !canEdit && styles.iconDisabled]}>
          <SymbolView
            name={{ ios: 'trash', android: 'delete_outline', web: 'delete_outline' }}
            size={15}
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
  contentWidth: number;
  cleaning: boolean;
  live: boolean;
};

function StudioTrackLaneWaveComponent({
  layer,
  selected,
  progress,
  offsetWidth,
  clipWidth,
  contentWidth,
  cleaning,
  live,
}: StudioTrackLaneWaveProps) {
  const color = LAYER_COLORS[layer.kind];
  const isEmpty = !layer.stemUri && !live;
  const tailWidth = Math.max(0, contentWidth - offsetWidth - clipWidth);

  return (
    <View style={[styles.wave, selected && styles.waveSelected, { width: contentWidth }]}>
        {isEmpty ? (
          <Text style={styles.emptyLabel}>Empty — tap Rec to fill this layer</Text>
        ) : live ? (
          <StudioLiveClip
            offsetWidth={offsetWidth}
            contentWidth={contentWidth}
            color={color}
            muted={layer.muted}
            waveHeight={LANE_WAVE_HEIGHT - 12}
          />
        ) : (
          <View style={styles.timelineRow}>
            {offsetWidth > 0 ? <View style={{ width: offsetWidth }} /> : null}
            {clipWidth > 0 ? (
              <View style={{ width: clipWidth }}>
                <StudioPeakWaveform
                  peaks={layer.peaks}
                  height={LANE_WAVE_HEIGHT - 12}
                  width={clipWidth}
                  color={color}
                  progress={progress}
                  dimmed={layer.muted}
                />
              </View>
            ) : null}
            {tailWidth > 0 ? (
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
    paddingLeft: 10,
    paddingRight: 6,
    justifyContent: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#E6E9EE',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E9EE',
    backgroundColor: '#FFFFFF',
  },
  headerSelected: {
    backgroundColor: '#F3F7FE',
  },
  kindDot: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5F6368',
  },
  nameSelected: {
    color: '#1A1D21',
  },
  duration: {
    marginTop: 1,
    fontSize: 11,
    color: '#9AA1A9',
    fontVariant: ['tabular-nums'],
  },
  durationSelected: {
    color: '#5F6368',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 2,
    marginLeft: -4,
  },
  iconButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  iconDisabled: {
    opacity: 0.3,
  },
  wave: {
    height: LANE_WAVE_HEIGHT,
    justifyContent: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E9EE',
    backgroundColor: '#FFFFFF',
  },
  waveSelected: {
    backgroundColor: '#F3F7FE',
  },
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
  emptyLabel: {
    fontSize: 11,
    color: '#9AA1A9',
    paddingLeft: 10,
  },
  cleaningBadge: {
    position: 'absolute',
    right: 8,
    top: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  cleaningLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1A73E8',
  },
});
