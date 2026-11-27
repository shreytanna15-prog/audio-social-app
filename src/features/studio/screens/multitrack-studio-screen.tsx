import { useCallback, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAudioRecorderBinding } from '@/features/audio/hooks/use-audio-recorder-binding';
import { useInputMonitor } from '@/features/audio/hooks/use-input-monitor';
import { recordingSessionService } from '@/features/audio/services/recording-session.service';
import { StudioBackingPlayers } from '@/features/studio/components/multitrack/studio-backing-players';
import { MultitrackLayerStack } from '@/features/studio/components/multitrack/multitrack-layer-stack';
import { QuickRecordProcessingOverlay } from '@/features/studio/components/quick-record-processing-overlay';
import { QuickRecordTimer } from '@/features/studio/components/quick-record-timer';
import { QuickRecordToolRow } from '@/features/studio/components/quick-record-tool-row';
import { QuickRecordTransport } from '@/features/studio/components/quick-record-transport';
import { QuickRecordTimeline } from '@/features/studio/components/quick-record-waveform';
import { StudioSessionTitle } from '@/features/studio/components/studio-session-title';
import { showPostPublishFeedClipPrompt } from '@/features/feed/utils/post-publish-feed-clip-prompt';
import { useMultitrackStudioScreen } from '@/features/studio/hooks/use-multitrack-studio-screen';
import {
  TanpuraPanel,
  TanpuraTriggerButton,
  useTanpuraController,
} from '@/features/tanpura';
import { TrackPublishSheet } from '@/features/tracks/components/track-publish-sheet';
import { ScreenHeader } from '@/shared/components/layout/screen-header';
import { useFeedbackDialog } from '@/shared/components/ui/feedback-dialog';
import { Text } from '@/shared/components/ui/text';

const DEFAULT_SESSION_TITLE = 'Untitled Session';

/**
 * Multitrack Studio — Studio Noir shell wired to the shared project session.
 * One shared timer/ruler/playhead; layers are offset clips inside the 30s window.
 */
export function MultitrackStudioScreen() {
  const insets = useSafeAreaInsets();
  useAudioRecorderBinding();
  const { show, confirm, showError, dialog } = useFeedbackDialog();
  const [publishOpen, setPublishOpen] = useState(false);
  const confirmRemoveLayer = useCallback(
    (layerName: string, onConfirm: () => void) => {
      confirm('Remove layer?', `Remove ${layerName} from this recording?`, {
        cancelLabel: 'Cancel',
        confirmLabel: 'Remove',
        destructive: true,
        onConfirm,
      });
    },
    [confirm],
  );
  const confirmDiscardSession = useCallback(
    (onConfirm: () => void) => {
      confirm('Discard changes?', 'Unsaved changes to this session will be lost.', {
        cancelLabel: 'Keep editing',
        confirmLabel: 'Discard',
        destructive: true,
        onConfirm,
      });
    },
    [confirm],
  );
  const session = useMultitrackStudioScreen({
    confirmRemoveLayer,
    confirmDiscardSession,
  });
  const monitor = useInputMonitor();
  const tanpura = useTanpuraController({
    isRecording: session.studio.isRecording,
  });
  const {
    studio,
    playback,
    duration,
    layoutDuration,
    selected,
    busy,
    canEditLayers,
    windowStartSeconds,
    setWindowStartSeconds,
    beginScrub,
    scrubTo,
    endScrub,
    togglePlayback,
    toggleRecord,
    save,
    saveToCloud,
    finishPublished,
    requestLeave,
    setFxProcessing,
    overlayVisible,
    overlayTitle,
    hasTake,
    title,
    setTitle,
    trackId,
    isSynced,
    isSyncing,
    isSaving,
  } = session;

  const publishTrack = trackId ? { id: trackId, title } : null;
  const publishDisabled =
    !hasTake || studio.isRecording || busy || isSaving || isSyncing;

  const playbackRef = useRef(playback);
  playbackRef.current = playback;
  const fxResumeRef = useRef<{ at: number; play: boolean } | null>(null);

  const handleFxProcessingChange = useCallback(
    (processing: boolean) => {
      setFxProcessing(processing);
      const transport = playbackRef.current;

      if (processing) {
        if (fxResumeRef.current != null) {
          return;
        }
        fxResumeRef.current = {
          at: transport.currentTime,
          play: transport.isPlaying,
        };
        transport.pause();
        return;
      }

      const resume = fxResumeRef.current;
      fxResumeRef.current = null;
      if (!resume) {
        return;
      }

      setTimeout(() => {
        const next = playbackRef.current;
        next.seekTo(resume.at);
        if (resume.play) {
          next.play();
        }
      }, 80);
    },
    [setFxProcessing],
  );

  const leaveBlocked = busy || studio.isRecording || isSaving || isSyncing;

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingBottom: Math.max(insets.bottom, 28) + 12 }}>
      <ScreenHeader
        left={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Discard"
            hitSlop={8}
            disabled={leaveBlocked}
            onPress={requestLeave}
            className="h-10 min-w-10 justify-center px-0.5 active:opacity-70"
            style={{ opacity: leaveBlocked ? 0.4 : 1 }}>
            <Text variant="label-md" className="text-destructive">
              Discard
            </Text>
          </Pressable>
        }
        title={
          <StudioSessionTitle
            title={title}
            onChangeTitle={setTitle}
            disabled={busy || studio.isRecording}
            dialogTitle="Rename session"
            placeholder={DEFAULT_SESSION_TITLE}
          />
        }
        right={
          <TanpuraTriggerButton
            active={tanpura.isPlaying || tanpura.panelOpen}
            onPress={() => tanpura.setPanelOpen(true)}
          />
        }
      />

      <View className="px-4 pt-3 pb-1">
        <QuickRecordTimer
          isRecording={studio.isRecording}
          displaySeconds={playback.currentTime}
          totalSeconds={duration}
          recordOriginSeconds={studio.recordOriginSeconds}
        />
      </View>

      <View className="flex-1 px-4 pt-1 pb-3">
        <QuickRecordTimeline
          isRecording={studio.isRecording}
          durationSeconds={duration}
          recordOriginSeconds={studio.recordOriginSeconds}
          windowStartSeconds={windowStartSeconds}
          onWindowStartChange={setWindowStartSeconds}
          playheadSeconds={playback.currentTime}
          onScrubStart={overlayVisible ? undefined : beginScrub}
          onSeek={overlayVisible ? undefined : scrubTo}
          onScrubEnd={overlayVisible ? undefined : endScrub}
        />
        <View className="flex-1 pt-2">
          <MultitrackLayerStack
            layers={studio.project.layers}
            selectedLayerId={studio.project.selectedLayerId}
            durationSeconds={layoutDuration}
            playheadSeconds={playback.currentTime}
            windowStartSeconds={windowStartSeconds}
            isRecording={studio.isRecording}
            isPlaying={playback.isPlaying}
            recordingLayerId={studio.recordingLayerId}
            recordOriginSeconds={studio.recordOriginSeconds}
            canEdit={canEditLayers}
            canAdd={studio.canAdd && canEditLayers}
            onWindowStartChange={setWindowStartSeconds}
            onSelectLayer={studio.selectLayer}
            onRenameLayer={studio.renameLayer}
            onToggleMute={studio.toggleMute}
            onRemoveLayer={studio.removeLayer}
            onScrubStart={overlayVisible ? undefined : beginScrub}
            onSeek={overlayVisible ? undefined : scrubTo}
            onScrubEnd={overlayVisible ? undefined : endScrub}
            onAddLayer={() => {
              void studio.addVocalLayer();
            }}
            onAddBeat={() => {
              void studio.addBeat();
            }}
          />
        </View>
      </View>

      <View className="gap-6 px-4 pt-2 pb-5">
        <QuickRecordToolRow
          layerId={selected?.id ?? null}
          baselineUri={selected?.baselineUri ?? selected?.stemUri ?? null}
          stemUri={selected?.stemUri ?? null}
          sourceUri={selected?.sourceUri ?? selected?.stemUri ?? null}
          initialEditChain={selected?.editChain ?? selected?.captureFx}
          durationSeconds={selected?.durationSeconds ?? 0}
          isSaving={busy || session.isCleaningSelected}
          disabled={studio.isRecording || !selected?.stemUri}
          onStemChange={studio.applyVocalStem}
          onProcessingChange={handleFxProcessingChange}
        />
        <QuickRecordTransport
          isRecording={studio.isRecording}
          isOptimizing={busy && !studio.isRecording}
          isSaving={
            studio.persistStatus === 'saving' || studio.isSaving
          }
          isPlaying={playback.isPlaying}
          hasTake={hasTake}
          isMonitoring={monitor.isMonitoringActive}
          headsetConnected={monitor.headsetConnected}
          onSave={() => void save()}
          onTogglePlayback={togglePlayback}
          onToggleRecord={toggleRecord}
          onToggleMonitor={monitor.toggleMonitor}
          onStopRecordPressIn={() => {
            studio.beginPostRecordBusy();
            recordingSessionService.requestStop();
          }}
          onOpenPublish={() => setPublishOpen(true)}
          publishDisabled={publishDisabled}
        />
      </View>

      <StudioBackingPlayers
        tracks={studio.backingTracks}
        startAtSeconds={studio.recordOriginSeconds}
        playing={studio.isRecording}
        paused={false}
      />

      <QuickRecordProcessingOverlay visible={overlayVisible} title={overlayTitle} />

      <TrackPublishSheet
        open={publishOpen}
        onOpenChange={setPublishOpen}
        track={publishTrack}
        initialTitle={title}
        bottomOffset={insets.bottom}
        onSaveToCloud={saveToCloud}
        canPublish={isSynced}
        synced={isSynced}
        isSyncing={isSyncing}
        onPublished={(trackId) => {
          showPostPublishFeedClipPrompt(show, {
            trackId,
            onCreate: (id) => {
              finishPublished({ createFeedClipTrackId: id });
            },
            onSkip: () => {
              finishPublished();
            },
          });
        }}
        onError={showError}
      />

      <TanpuraPanel controller={tanpura} />
      {dialog}
    </View>
  );
}
