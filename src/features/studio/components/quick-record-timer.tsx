import { View } from 'react-native';

import { useCaptureElapsed } from '@/features/audio/hooks/use-capture-elapsed';
import { formatQuickRecordTimer } from '@/features/studio/utils/format-timer';
import { Text } from '@/shared/components/ui/text';

type QuickRecordTimerProps = {
  isRecording: boolean;
  /** Playhead position when idle. */
  displaySeconds: number;
  /** Full take length when idle (0 when empty). */
  totalSeconds?: number;
  /** Punch-in origin on the timeline while recording. */
  recordOriginSeconds?: number;
};

/**
 * Isolated 10 Hz clock — must not share a parent that renders peak bars.
 * While recording: left = origin + elapsed, right = growing projected length.
 */
export function QuickRecordTimer({
  isRecording,
  displaySeconds,
  totalSeconds = 0,
  recordOriginSeconds = 0,
}: QuickRecordTimerProps) {
  const elapsed = useCaptureElapsed(isRecording);
  const shown = isRecording
    ? Math.max(0, recordOriginSeconds) + elapsed
    : displaySeconds;
  const total = isRecording
    ? Math.max(totalSeconds, Math.max(0, recordOriginSeconds) + elapsed)
    : totalSeconds;

  return (
    <View className="flex-row items-baseline gap-1.5">
      <Text variant="headline-lg-mobile" className="text-on-surface">
        {formatQuickRecordTimer(shown)}
      </Text>
      <Text variant="body-md" className="text-on-surface-variant">
        / {formatQuickRecordTimer(total)}
      </Text>
    </View>
  );
}
