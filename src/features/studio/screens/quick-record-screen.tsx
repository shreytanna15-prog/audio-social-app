import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { BackHandler, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAudioRecorderBinding } from '@/features/audio/hooks/use-audio-recorder-binding';
import { useInputMonitor } from '@/features/audio/hooks/use-input-monitor';
import { recordingSessionService } from '@/features/audio/services/recording-session.service';
import { QuickRecordCaptureFxRow } from '@/features/studio/components/quick-record-capture-fx-row';
import { QuickRecordCaptureStage } from '@/features/studio/components/quick-record-capture-stage';
import { QuickRecordCaptureTransport } from '@/features/studio/components/quick-record-capture-transport';
import { QuickRecordProcessingOverlay } from '@/features/studio/components/quick-record-processing-overlay';
import { QuickRecordTimer } from '@/features/studio/components/quick-record-timer';
import { QuickRecordTitlePill } from '@/features/studio/components/quick-record-title-pill';
import { QuickRecordWaveform } from '@/features/studio/components/quick-record-waveform';
import { useQuickRecordSession } from '@/features/studio/hooks/use-quick-record-session';
import { ScreenHeader } from '@/shared/components/layout/screen-header';
import { useFeedbackDialog } from '@/shared/components/ui/feedback-dialog';
import { Text } from '@/shared/components/ui/text';

const CAPTURE_WAVE_HEIGHT = 72;

export function QuickRecordScreen() {
  const insets = useSafeAreaInsets();
  useAudioRecorderBinding();
  const { confirm, dialog } = useFeedbackDialog();
  const confirmDiscard = useCallback(
    (onConfirm: () => void) => {
      confirm('Discard recording?', 'Your take will be lost.', {
        cancelLabel: 'Keep editing',
        confirmLabel: 'Discard',
        destructive: true,
        onConfirm,
      });
    },
    [confirm],
  );
  const session = useQuickRecordSession({ confirmDiscard });
  const monitor = useInputMonitor();
  const { requestClose } = session;
  const [windowStartSeconds, setWindowStartSeconds] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const onHardwareBack = () => {
        requestClose();
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
      return () => sub.remove();
    }, [requestClose]),
  );

  const displaySeconds = session.hasTake || session.isScrubbing
    ? session.currentTime
    : 0;
  const progress =
    session.durationSeconds > 0
      ? session.currentTime / session.durationSeconds
      : 0;
  const overlayTitle = session.isApplyingCaptureFx
    ? 'Applying effects…'
    : 'Cleaning take…';

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingBottom: Math.max(insets.bottom, 28) + 12 }}>
      <ScreenHeader
        title="Quick Record"
        left={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Discard"
            hitSlop={8}
            onPress={requestClose}
            className="h-10 min-w-10 justify-center px-0.5 active:opacity-70">
            <Text variant="label-md" className="text-destructive">
              Discard
            </Text>
          </Pressable>
        }
      />

      <View className="px-5 pt-3">
        <View className="flex-row items-end justify-between pb-1">
          <QuickRecordTimer
            isRecording={session.isRecording}
            displaySeconds={displaySeconds}
            totalSeconds={session.durationSeconds}
            recordOriginSeconds={session.recordOriginSeconds}
          />

          <QuickRecordTitlePill
            title={session.title}
            onChangeTitle={session.setTitle}
            disabled={session.isBusy || session.isRecording}
          />
        </View>
      </View>

      <View className="flex-1 justify-center px-5 pt-2">
        <QuickRecordCaptureStage
          isRecording={session.isRecording}
          hasTake={session.hasTake}
          isPlaying={session.isPlaying}
          peaks={session.peaks}
          progress={progress}
        />
      </View>

      <View className="px-4 pb-2">
        <QuickRecordCaptureFxRow
          selection={session.captureFxSelection}
          disabled={false}
          isProcessing={session.isApplyingCaptureFx}
          onChange={session.setCaptureFxSelection}
        />
      </View>

      {/* Real timeline + waveform — same punch-in/scrub engine, compact card */}
      <View className="px-4 pb-3">
        <View
          className="overflow-hidden rounded-3xl px-3.5 pb-3.5 pt-2.5"
          style={{
            backgroundColor: 'rgba(31,31,37,0.96)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.07)',
            borderCurve: 'continuous',
            boxShadow: '0 10px 28px rgba(0,0,0,0.35)',
          }}>
          <View style={{ height: CAPTURE_WAVE_HEIGHT + 36 }}>
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
              waveHeight={CAPTURE_WAVE_HEIGHT}
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
        </View>
      </View>

      <View className="px-5 pb-5 pt-1">
        <QuickRecordCaptureTransport
          isRecording={session.isRecording}
          isOptimizing={session.isBusy}
          isPlaying={session.isPlaying}
          hasTake={session.hasTake}
          isCleaning={session.isCleaning}
          isMonitoring={monitor.isMonitoringActive}
          headsetConnected={monitor.headsetConnected}
          onTogglePlayback={session.togglePlayback}
          onToggleRecord={session.toggleRecord}
          onToggleMonitor={monitor.toggleMonitor}
          onNext={() => void session.goNext()}
          onStopRecordPressIn={() => {
            session.beginPostRecordBusy();
            recordingSessionService.requestStop();
          }}
        />
      </View>

      <QuickRecordProcessingOverlay
        visible={session.isBusy}
        title={overlayTitle}
      />
      {dialog}
    </View>
  );
}
