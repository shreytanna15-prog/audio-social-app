import { View } from 'react-native';

import { useCaptureElapsed } from '@/features/audio/hooks/use-capture-elapsed';
import {
  QUICK_RECORD_MAX_SECONDS,
} from '@/features/studio/hooks/use-quick-record-session';
import { formatQuickRecordTimer } from '@/features/studio/utils/format-timer';
import { Text } from '@/shared/components/ui/text';

type QuickRecordTimerProps = {
  isRecording: boolean;
  /** Playback or take duration when idle. */
  displaySeconds: number;
  maxSeconds?: number;
};

/**
 * Isolated 10 Hz clock — must not share a parent that renders peak bars.
 */
export function QuickRecordTimer({
  isRecording,
  displaySeconds,
  maxSeconds = QUICK_RECORD_MAX_SECONDS,
}: QuickRecordTimerProps) {
  const elapsed = useCaptureElapsed(isRecording);
  const shown = isRecording ? elapsed : displaySeconds;

  return (
    <View className="flex-row items-baseline gap-1.5">
      <Text variant="headline-lg-mobile" className="text-on-surface">
        {formatQuickRecordTimer(shown)}
      </Text>
      <Text variant="body-md" className="text-on-surface-variant">
        / {formatQuickRecordTimer(maxSeconds)}
      </Text>
    </View>
  );
}
