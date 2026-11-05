import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import { FeedLoopLockedIcon } from './feed-loop-locked-icon';

/** Figma feed waveform palette */
const PLAYED = '#D0BCFF';
const PLAYHEAD = '#E4E1EA';
const UNPLAYED = 'rgba(52, 52, 59, 0.7)';

const BAR_WIDTH = 4;
const PLAYHEAD_WIDTH = 6;
/** Tallest bar height — frame hugs bar bottoms for save-button alignment */
const WAVE_FRAME = 28;

/**
 * Exact bar heights from Figma SVG (26 bars in 48px frame).
 * Bars are vertically centered via `items-center`.
 */
const FIGMA_HEIGHTS = [
  12, 16, 24, 20, 28, 16, 24, 20, 28, 12, 24, 28, 28, 20, 28, 16, 24, 12, 20,
  24, 16, 20, 12, 24, 16, 8,
] as const;

const BAR_COUNT = FIGMA_HEIGHTS.length;

function formatPreviewTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

type WaveProps = {
  vibeId: string;
  peaks: number[];
  progress: number;
  /** Tap waveform to play / pause preview. */
  onPress?: () => void;
  accessibilityLabel?: string;
};

type TimeProps = {
  currentSec: number;
  previewDurationSec: number;
};

/**
 * Figma waveform: vertically centered bars, continuous playhead from `progress`
 * (0–1) so the highlight moves smoothly while audio plays.
 */
export function FeedWaveformBars({
  vibeId,
  progress,
  onPress,
  accessibilityLabel = 'Play or pause preview',
}: WaveProps) {
  const clamped = Math.min(1, Math.max(0, progress));
  /** Continuous index along the bar strip for smooth playhead travel */
  const playheadExact = clamped * (BAR_COUNT - 1);
  const playheadIndex = Math.min(BAR_COUNT - 1, Math.max(0, Math.floor(playheadExact)));
  const playheadFrac = playheadExact - playheadIndex;

  const bars = (
    <View
      className="w-full flex-row items-center justify-between"
      style={{ height: WAVE_FRAME }}>
      {FIGMA_HEIGHTS.map((figmaHeight, index) => {
        const isPlayhead = index === playheadIndex;
        const filled = index < playheadIndex;
        /** Soft lead-in on the bar just behind the playhead */
        const nearPlayhead =
          index === playheadIndex - 1 && clamped > 0 && playheadFrac < 0.35;
        const height = isPlayhead ? 28 : figmaHeight;
        const width = isPlayhead ? PLAYHEAD_WIDTH : BAR_WIDTH;

        return (
          <View
            key={`${vibeId}-bar-${index}`}
            style={{
              width,
              height,
              borderRadius: isPlayhead ? 3 : 2,
              backgroundColor: isPlayhead ? PLAYHEAD : filled ? PLAYED : UNPLAYED,
              opacity: isPlayhead ? 0.85 + playheadFrac * 0.15 : 1,
              boxShadow: isPlayhead
                ? '0 0 10px rgba(255,255,255,1)'
                : nearPlayhead
                  ? '0 0 8px rgba(208,188,255,0.7)'
                  : undefined,
            }}
          />
        );
      })}
    </View>
  );

  if (!onPress) {
    return bars;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}>
      {bars}
    </Pressable>
  );
}

export function FeedPreviewTimeRow({ currentSec, previewDurationSec }: TimeProps) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="w-10 font-sans text-[11px] font-medium leading-3.5 text-[#CBC3D7]">
        {formatPreviewTime(currentSec)}
      </Text>
      <View className="flex-row items-center gap-1">
        <FeedLoopLockedIcon />
        <Text
          className="font-sans text-[11px] font-medium leading-3.5"
          style={{ color: 'rgba(203, 195, 215, 0.85)' }}>
          Loop Locked
        </Text>
      </View>
      <Text className="w-10 text-right font-sans text-[11px] font-medium leading-3.5 text-[#CBC3D7]">
        {formatPreviewTime(previewDurationSec)}
      </Text>
    </View>
  );
}

type FeedPreviewControlsProps = WaveProps & TimeProps;

export function FeedPreviewControls({
  vibeId,
  peaks,
  progress,
  currentSec,
  previewDurationSec,
  onPress,
  accessibilityLabel,
}: FeedPreviewControlsProps) {
  return (
    <View className="gap-1">
      <FeedWaveformBars
        vibeId={vibeId}
        peaks={peaks}
        progress={progress}
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
      />
      <FeedPreviewTimeRow
        currentSec={currentSec}
        previewDurationSec={previewDurationSec}
      />
    </View>
  );
}
