import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAudioRecorderBinding } from '@/features/audio/hooks/use-audio-recorder-binding';
import { recordingSessionService } from '@/features/audio/services/recording-session.service';
import { QuickRecordCaptureTransport } from '@/features/studio/components/quick-record-capture-transport';
import { QuickRecordProcessingOverlay } from '@/features/studio/components/quick-record-processing-overlay';
import { QuickRecordTimer } from '@/features/studio/components/quick-record-timer';
import {
  QuickRecordTimeline,
  QuickRecordWaveform,
} from '@/features/studio/components/quick-record-waveform';
import { useQuickRecordSession } from '@/features/studio/hooks/use-quick-record-session';
import { Text } from '@/shared/components/ui/text';

export function QuickRecordScreen() {
  const insets = useSafeAreaInsets();
  useAudioRecorderBinding();
  const session = useQuickRecordSession();
  const [windowStartSeconds, setWindowStartSeconds] = useState(0);

  const displaySeconds = session.hasTake || session.isScrubbing
    ? session.currentTime
    : 0;
  const progress =
    session.durationSeconds > 0
      ? session.currentTime / session.durationSeconds
      : 0;
  const overlayTitle = session.isOptimizing ? 'Finishing recording…' : 'Cleaning take…';
  const discardDisabled = session.isRecording || session.isBusy;

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingBottom: Math.max(insets.bottom, 28) + 12 }}>
      <View
        className="border-b border-white/5 px-4"
        style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}>
        <View className="h-10 flex-row items-center justify-center">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Discard"
            hitSlop={8}
            disabled={discardDisabled}
            onPress={session.requestClose}
            className="absolute left-0 z-10 h-10 justify-center px-0.5 active:opacity-70"
            style={{ opacity: discardDisabled ? 0.4 : 1 }}>
            <Text variant="label-md" className="text-destructive">
              Discard
            </Text>
          </Pressable>

          <Text variant="title-md" className="text-on-surface">
            Quick Record
          </Text>
        </View>
      </View>

      <View className="px-4 pt-3">
        <View className="flex-row items-end justify-between pb-2">
          <QuickRecordTimer
            isRecording={session.isRecording}
            displaySeconds={displaySeconds}
            totalSeconds={session.durationSeconds}
            recordOriginSeconds={session.recordOriginSeconds}
          />

          <View className="rounded-full border border-white/10 bg-surface-container px-3 py-1.5">
            <Text variant="label-sm" className="text-on-surface">
              Untitled take
            </Text>
          </View>
        </View>

        <QuickRecordTimeline
          isRecording={session.isRecording}
          durationSeconds={session.durationSeconds}
          recordOriginSeconds={session.recordOriginSeconds}
          windowStartSeconds={windowStartSeconds}
        />
      </View>

      <View className="flex-1 px-4 pt-3 pb-4">
        <QuickRecordWaveform
          peaks={session.peaks}
          isRecording={session.isRecording}
          hasTake={session.hasTake}
          isPlaying={session.isPlaying}
          progress={progress}
          durationSeconds={session.durationSeconds}
          recordOriginSeconds={session.recordOriginSeconds}
          windowStartSeconds={windowStartSeconds}
          onWindowStartChange={setWindowStartSeconds}
          onScrubStart={session.isBusy ? undefined : session.beginScrub}
          onSeek={session.isBusy ? undefined : session.scrubTo}
          onScrubEnd={
            session.isBusy
              ? undefined
              : (seconds) => {
                  void session.endScrub(seconds);
                }
          }
        />
      </View>

      <View className="px-4 pt-2 pb-5">
        <QuickRecordCaptureTransport
          isRecording={session.isRecording}
          isOptimizing={session.isOptimizing}
          isPlaying={session.isPlaying}
          hasTake={session.hasTake}
          isCleaning={session.isCleaning}
          onTogglePlayback={session.togglePlayback}
          onToggleRecord={session.toggleRecord}
          onNext={() => void session.goNext()}
          onStopRecordPressIn={() => recordingSessionService.requestStop()}
        />
      </View>

      <QuickRecordProcessingOverlay
        visible={session.isBusy}
        title={overlayTitle}
      />
    </View>
  );
}
