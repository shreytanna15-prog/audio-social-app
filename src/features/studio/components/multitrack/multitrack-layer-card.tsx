import { Pencil, Trash2, Volume2, VolumeX } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import {
  LIVE_WINDOW_FOLLOW_LEAD_SECONDS,
  clipFrameInWindow,
  liveWindowPxPerSecond,
} from '@/features/audio/domain/live-window';
import { normalizeMetering } from '@/features/audio/domain/recorder-session.helpers';
import { liveClipWidthPx, slotBarCount } from '@/features/audio/domain/timeline';
import { recordingSessionService } from '@/features/audio/services/recording-session.service';
import { formatDuration } from '@/features/audio/utils/format';
import { StudioPeakWaveform } from '@/features/studio/components/multitrack/studio-peak-waveform';
import type { ProjectLayer } from '@/features/audio/types/project';
import { Text } from '@/shared/components/ui/text';
import { cn } from '@/shared/lib/utils';

export const MULTITRACK_LANE_WAVE_HEIGHT = 56;

type MultitrackLayerCardProps = {
  layer: ProjectLayer;
  selected: boolean;
  canEdit: boolean;
  /** Wave column width — must match the shared time ruler. */
  viewportWidth: number;
  windowStartSeconds: number;
  playheadSeconds: number;
  isLive: boolean;
  liveOriginSeconds: number;
  onSelect: () => void;
  onEditName?: () => void;
  onToggleMute: () => void;
  onRemove: () => void;
};

/**
 * Live meter aligned to the shared 30s window — same math as Quick Record.
 */
function MultitrackLiveMeter({
  viewportWidth,
  windowStartSeconds,
  originSeconds,
}: {
  viewportWidth: number;
  windowStartSeconds: number;
  originSeconds: number;
}) {
  const [bars, setBars] = useState<number[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const pendingRef = useRef(0);
  const elapsedRef = useRef(0);
  const pps = liveWindowPxPerSecond(viewportWidth);
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

  if (viewportWidth <= 0 || pps <= 0 || elapsed <= 0 || bars.length === 0) {
    return null;
  }

  const origin = Math.max(0, originSeconds);
  const startX = (origin - windowStartSeconds) * pps;
  const following = origin === 0 && elapsed >= LIVE_WINDOW_FOLLOW_LEAD_SECONDS;
  const liveWidth = following
    ? LIVE_WINDOW_FOLLOW_LEAD_SECONDS * pps
    : liveClipWidthPx(elapsed, pps);
  const drawStartX = following ? 0 : startX;
  const visibleLeft = Math.max(0, drawStartX);
  const visibleRight = Math.min(viewportWidth, drawStartX + liveWidth);
  const visibleWidth = visibleRight - visibleLeft;
  if (visibleWidth <= 1) {
    return null;
  }

  const cropLeft = Math.max(0, -drawStartX);
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
        height: MULTITRACK_LANE_WAVE_HEIGHT,
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
      <StudioPeakWaveform
        peaks={visibleBars.length > 0 ? visibleBars : fullBars}
        height={MULTITRACK_LANE_WAVE_HEIGHT}
        width={visibleWidth}
        color="#A078FF"
        fillSlots={false}
        pinBars
        progress={1}
      />
    </View>
  );
}

export function MultitrackLayerCard({
  layer,
  selected,
  canEdit,
  viewportWidth,
  windowStartSeconds,
  playheadSeconds,
  isLive,
  liveOriginSeconds,
  onSelect,
  onEditName,
  onToggleMute,
  onRemove,
}: MultitrackLayerCardProps) {
  const empty = !layer.stemUri && !isLive;
  const muted = layer.muted;
  const offsetSeconds = layer.offsetMs / 1000;
  const frame = clipFrameInWindow(
    offsetSeconds,
    layer.durationSeconds,
    windowStartSeconds,
    viewportWidth,
  );
  const takeProgress =
    layer.durationSeconds > 0
      ? Math.min(
          1,
          Math.max(0, (playheadSeconds - offsetSeconds) / layer.durationSeconds),
        )
      : 0;

  // Inset ring keeps layout width equal to the ruler (no border box shrink).
  // Empty layers keep a dashed border so they read as slots.
  const ring = selected
    ? 'inset 0 0 0 2px rgba(208, 188, 255, 0.85)'
    : 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)';

  return (
    <View
      className={cn(
        'mb-2.5 overflow-hidden rounded-2xl',
        selected ? 'bg-primary/22' : 'bg-primary/10',
        empty
          ? selected
            ? 'border border-dashed border-primary'
            : 'border border-dashed border-white/20'
          : null,
        muted ? 'opacity-90' : null,
      )}
      style={empty ? undefined : { boxShadow: ring }}>
      <View className="flex-row items-center gap-2 px-3 pt-2.5 pb-2">
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-1.5">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Select ${layer.name}`}
              onPress={onSelect}
              className="min-w-0 shrink">
              <Text
                variant="label-md"
                className={cn(
                  muted ? 'text-on-surface-variant' : 'text-on-surface',
                  selected ? 'font-semibold text-primary-tonal' : undefined,
                )}
                numberOfLines={1}>
                {layer.name}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Rename ${layer.name}`}
              hitSlop={8}
              disabled={!canEdit}
              onPress={onEditName}
              className={cn(
                'h-5 w-5 items-center justify-center rounded-md active:bg-white/10',
                !canEdit ? 'opacity-40' : null,
              )}>
              <Pencil size={10} color="#CBC3D7" strokeWidth={2} />
            </Pressable>
            {!empty && layer.durationSeconds > 0 ? (
              <Text
                variant="caption"
                className="shrink-0 text-on-surface-variant"
                numberOfLines={1}>
                {formatDuration(layer.durationSeconds)}
              </Text>
            ) : null}
            {muted ? (
              <Text
                variant="caption"
                className="shrink-0 text-secondary-tonal"
                numberOfLines={1}>
                MUTED
              </Text>
            ) : null}
          </View>
        </View>

        <View className="flex-row items-center gap-1">
          {!empty ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                muted ? `Unmute ${layer.name}` : `Mute ${layer.name}`
              }
              hitSlop={8}
              onPress={onToggleMute}
              className={cn(
                'h-9 w-9 items-center justify-center rounded-xl',
                muted ? 'bg-secondary-container/35' : 'bg-white/5',
              )}>
              {muted ? (
                <VolumeX size={16} color="#FFB0CD" strokeWidth={2} />
              ) : (
                <Volume2 size={16} color="#E4E1EA" strokeWidth={2} />
              )}
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${layer.name}`}
            hitSlop={8}
            disabled={!canEdit}
            onPress={onRemove}
            className={cn(
              'h-9 w-9 items-center justify-center rounded-xl bg-white/5',
              !canEdit ? 'opacity-40' : null,
            )}>
            <Trash2 size={16} color="#FFB4AB" strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Select ${layer.name} waveform`}
        onPress={onSelect}
        className={cn('bg-primary/5', muted ? 'opacity-40' : null)}
        style={{
          height: MULTITRACK_LANE_WAVE_HEIGHT,
          width: '100%',
        }}>
        <View
          style={{
            height: MULTITRACK_LANE_WAVE_HEIGHT,
            width: '100%',
          }}
          pointerEvents="none">
        {layer.peaks.length > 0 && frame.widthPx > 1 ? (
          <View
            style={{
              marginLeft: frame.leftPx,
              width: Math.max(1, frame.widthPx),
              height: MULTITRACK_LANE_WAVE_HEIGHT,
            }}>
            <StudioPeakWaveform
              peaks={layer.peaks}
              height={MULTITRACK_LANE_WAVE_HEIGHT}
              width={Math.max(1, frame.widthPx)}
              color="#D0BCFF"
              progress={takeProgress}
              dimmed={muted}
            />
          </View>
        ) : null}

        {isLive ? (
          <MultitrackLiveMeter
            viewportWidth={viewportWidth}
            windowStartSeconds={windowStartSeconds}
            originSeconds={liveOriginSeconds}
          />
        ) : null}
        </View>
      </Pressable>
    </View>
  );
}
