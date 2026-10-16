import { ArrowLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { recordingSessionService } from '@/features/audio/services/recording-session.service';
import { QuickRecordProcessingOverlay } from '@/features/studio/components/quick-record-processing-overlay';
import { QuickRecordTimer } from '@/features/studio/components/quick-record-timer';
import { QuickRecordToolRow } from '@/features/studio/components/quick-record-tool-row';
import { QuickRecordTransport } from '@/features/studio/components/quick-record-transport';
import {
  QuickRecordTimeline,
  QuickRecordWaveform,
} from '@/features/studio/components/quick-record-waveform';
import { useQuickRecordEditSession } from '@/features/studio/hooks/use-quick-record-edit-session';
import { Text } from '@/shared/components/ui/text';

export function QuickRecordEditScreen() {
  const insets = useSafeAreaInsets();
  // Recorder binding stays on the capture screen underneath the stack.
  const session = useQuickRecordEditSession();
  const [windowStartSeconds, setWindowStartSeconds] = useState(0);

  const displaySeconds = session.hasTake || session.isScrubbing
    ? session.currentTime
    : 0;
  const progress =
    session.durationSeconds > 0
      ? session.currentTime / session.durationSeconds
      : 0;
  const overlayVisible =
    session.isBusy || session.fxProcessing || session.isSaving;
  const overlayTitle = session.isSaving
    ? 'Saving…'
    : session.fxProcessing
      ? 'Applying FX…'
      : session.isOptimizing
        ? 'Finishing recording…'
        : 'Cleaning take…';

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingBottom: Math.max(insets.bottom, 28) + 12 }}>
      <View
        className="border-b border-white/5 px-4"
        style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}>
        <View className="h-10 flex-row items-center justify-between">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            onPress={session.goBackToCapture}
            className="h-10 w-10 items-center justify-center rounded-full active:bg-surface-bright">
            <ArrowLeft size={20} color="#E4E1EA" strokeWidth={2} />
          </Pressable>

          <Text variant="title-md" className="text-on-surface">
            Edit take
          </Text>

          <View className="h-10 w-10" />
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
          onScrubStart={overlayVisible ? undefined : session.beginScrub}
          onSeek={overlayVisible ? undefined : session.scrubTo}
          onScrubEnd={
            overlayVisible
              ? undefined
              : (seconds) => {
                  void session.endScrub(seconds);
                }
          }
        />
      </View>

      <View className="gap-6 px-4 pt-2 pb-5">
        <QuickRecordToolRow
          layerId={session.layerId}
          baselineUri={session.baselineUri}
          stemUri={session.stemUri}
          sourceUri={session.sourceUri}
          initialEditChain={session.editChain}
          durationSeconds={session.durationSeconds}
          isSaving={session.isSaving || session.isBusy}
          disabled={session.isBusy || session.isRecording}
          onStemChange={session.onStemChange}
          onProcessingChange={session.setFxProcessing}
        />
        <QuickRecordTransport
          isRecording={session.isRecording}
          isOptimizing={session.isBusy}
          isSaving={session.isSaving}
          isPlaying={session.isPlaying}
          hasTake={session.hasTake}
          onSave={() => void session.save()}
          onTogglePlayback={session.togglePlayback}
          onToggleRecord={session.toggleRecord}
          onStopRecordPressIn={() => recordingSessionService.requestStop()}
        />
      </View>

      <QuickRecordProcessingOverlay
        visible={overlayVisible}
        title={overlayTitle}
      />
    </View>
  );
}
