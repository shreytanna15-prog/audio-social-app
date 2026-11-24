import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { BackHandler, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useInputMonitor } from '@/features/audio/hooks/use-input-monitor';
import { recordingSessionService } from '@/features/audio/services/recording-session.service';
import { QuickRecordProcessingOverlay } from '@/features/studio/components/quick-record-processing-overlay';
import { QuickRecordTimer } from '@/features/studio/components/quick-record-timer';
import { QuickRecordToolRow } from '@/features/studio/components/quick-record-tool-row';
import { QuickRecordTransport } from '@/features/studio/components/quick-record-transport';
import {
  QuickRecordWaveform,
  RULER_HEIGHT,
} from '@/features/studio/components/quick-record-waveform';
import { StudioSessionTitle } from '@/features/studio/components/studio-session-title';
import { useQuickRecordEditSession } from '@/features/studio/hooks/use-quick-record-edit-session';
import { DEFAULT_QUICK_RECORD_TITLE } from '@/features/studio/store/quick-record.store';
import { TrackPublishSheet } from '@/features/tracks/components/track-publish-sheet';
import { ScreenHeader } from '@/shared/components/layout/screen-header';
import { useFeedbackDialog } from '@/shared/components/ui/feedback-dialog';
import { Text } from '@/shared/components/ui/text';

const EDIT_WAVE_HEIGHT = 140;
const EDIT_WAVE_PADDING = 16;

export function QuickRecordEditScreen() {
  const insets = useSafeAreaInsets();
  const { showError, confirm, dialog } = useFeedbackDialog();
  // Recorder binding stays on the capture screen underneath the stack.
  const session = useQuickRecordEditSession({
    onError: (title, message) => showError(title, message),
  });
  const monitor = useInputMonitor();
  const [windowStartSeconds, setWindowStartSeconds] = useState(0);
  const [publishOpen, setPublishOpen] = useState(false);

  const {
    fromImport,
    isNew,
    isDirty,
    isBusy,
    isRecording,
    isSaving,
    isSyncing,
    fxProcessing,
    discardTarget,
    discardImported,
  } = session;

  const isLeaveBlocked =
    isBusy || isRecording || isSaving || isSyncing || fxProcessing;

  // Fresh import (isNew): always confirm — the import itself is unsaved work.
  // Library reopen: confirm only when title / audio / FX changed (isDirty).
  const requestDiscard = useCallback(() => {
    if (isLeaveBlocked) {
      return;
    }
    if (!isNew && !isDirty) {
      discardImported();
      return;
    }
    confirm(
      isNew ? 'Discard imported audio?' : 'Discard changes?',
      isNew
        ? 'This imported take will be removed and nothing is saved.'
        : discardTarget === 'library'
          ? 'Unsaved changes to this take will be lost.'
          : 'Unsaved changes will be lost and nothing is saved.',
      {
        cancelLabel: 'Keep editing',
        confirmLabel: 'Discard',
        destructive: true,
        onConfirm: () => {
          discardImported();
        },
      },
    );
  }, [
    confirm,
    discardImported,
    discardTarget,
    isDirty,
    isLeaveBlocked,
    isNew,
  ]);

  useFocusEffect(
    useCallback(() => {
      if (!fromImport) return;
      const onHardwareBack = () => {
        requestDiscard();
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
      return () => sub.remove();
    }, [fromImport, requestDiscard]),
  );

  const displaySeconds = session.hasTake || session.isScrubbing
    ? session.currentTime
    : 0;
  const progress =
    session.durationSeconds > 0
      ? session.currentTime / session.durationSeconds
      : 0;

  const publishTrack = session.trackId
    ? { id: session.trackId, title: session.title }
    : null;
  const publishDisabled =
    !session.hasTake ||
    session.isRecording ||
    session.isBusy ||
    session.isSaving ||
    session.isSyncing;

  const titleDisabled =
    session.isBusy || session.isSaving || session.fxProcessing || session.isRecording;

  const discardHeader = session.fromImport ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Discard"
      hitSlop={8}
      disabled={isLeaveBlocked}
      onPress={requestDiscard}
      className="h-10 min-w-10 justify-center px-0.5 active:opacity-70"
      style={{ opacity: isLeaveBlocked ? 0.4 : 1 }}>
      <Text variant="label-md" className="text-destructive">
        Discard
      </Text>
    </Pressable>
  ) : null;

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingBottom: Math.max(insets.bottom, 28) + 12 }}>
      <ScreenHeader
        title={
          <StudioSessionTitle
            title={session.title}
            onChangeTitle={session.setTitle}
            disabled={titleDisabled}
            dialogTitle="Rename take"
            placeholder={DEFAULT_QUICK_RECORD_TITLE}
          />
        }
        onBack={session.goBackToCapture}
        left={discardHeader}
        backDisabled={session.fromImport}
      />

      <View className="px-4 pt-3 pb-2">
        <QuickRecordTimer
          isRecording={session.isRecording}
          displaySeconds={displaySeconds}
          totalSeconds={session.durationSeconds}
          recordOriginSeconds={session.recordOriginSeconds}
        />
      </View>

      <View className="px-4">
        <View
          className="overflow-hidden rounded-3xl px-3.5"
          style={{
            height:
              RULER_HEIGHT + EDIT_WAVE_HEIGHT + EDIT_WAVE_PADDING * 2,
            paddingVertical: EDIT_WAVE_PADDING,
            backgroundColor: 'rgba(31,31,37,0.96)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.07)',
            borderCurve: 'continuous',
            boxShadow: '0 10px 28px rgba(0,0,0,0.35)',
          }}>
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
            waveHeight={EDIT_WAVE_HEIGHT}
            onScrubStart={session.overlayVisible ? undefined : session.beginScrub}
            onSeek={session.overlayVisible ? undefined : session.scrubTo}
            onScrubEnd={
              session.overlayVisible
                ? undefined
                : (seconds) => {
                    void session.endScrub(seconds);
                  }
            }
          />
        </View>
      </View>

      <View className="flex-1" />

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
          onOpenPublish={() => setPublishOpen(true)}
          publishDisabled={publishDisabled}
        />
      </View>

      <QuickRecordProcessingOverlay
        visible={session.overlayVisible}
        title={session.overlayTitle}
      />

      <TrackPublishSheet
        open={publishOpen}
        onOpenChange={setPublishOpen}
        track={publishTrack}
        initialTitle={session.title}
        bottomOffset={insets.bottom}
        onSaveToCloud={session.saveToCloud}
        canPublish={session.isSynced}
        synced={session.isSynced}
        isSyncing={session.isSyncing}
        onPublished={session.finishPublished}
        onError={showError}
      />

      {dialog}
    </View>
  );
}
