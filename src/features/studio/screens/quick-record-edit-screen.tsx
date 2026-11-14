import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useInputMonitor } from '@/features/audio/hooks/use-input-monitor';
import { recordingSessionService } from '@/features/audio/services/recording-session.service';
import { QuickRecordProcessingOverlay } from '@/features/studio/components/quick-record-processing-overlay';
import { QuickRecordTimer } from '@/features/studio/components/quick-record-timer';
import { QuickRecordTitlePill } from '@/features/studio/components/quick-record-title-pill';
import { QuickRecordToolRow } from '@/features/studio/components/quick-record-tool-row';
import { QuickRecordTransport } from '@/features/studio/components/quick-record-transport';
import { QuickRecordWaveform } from '@/features/studio/components/quick-record-waveform';
import { useQuickRecordEditSession } from '@/features/studio/hooks/use-quick-record-edit-session';
import { ScreenHeader } from '@/shared/components/layout/screen-header';

export function QuickRecordEditScreen() {
  const insets = useSafeAreaInsets();
  // Recorder binding stays on the capture screen underneath the stack.
  const session = useQuickRecordEditSession();
  const monitor = useInputMonitor();
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
      <ScreenHeader title="Edit take" onBack={session.goBackToCapture} />

      <View className="px-4 pt-3">
        <View className="flex-row items-end justify-between pb-2">
          <QuickRecordTimer
            isRecording={session.isRecording}
            displaySeconds={displaySeconds}
            totalSeconds={session.durationSeconds}
            recordOriginSeconds={session.recordOriginSeconds}
          />

          <QuickRecordTitlePill
            title={session.title}
            onChangeTitle={session.setTitle}
            disabled={session.isBusy || session.isSaving || session.fxProcessing}
          />
        </View>

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
          initialEditChain={session.editChain ?? session.captureFx}
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
          isMonitoring={monitor.isMonitoringActive}
          headsetConnected={monitor.headsetConnected}
          onSave={() => void session.save()}
          onTogglePlayback={session.togglePlayback}
          onToggleRecord={session.toggleRecord}
          onToggleMonitor={monitor.toggleMonitor}
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
