import { ArrowLeft, MoreVertical, Pencil } from 'lucide-react-native';
import { useCallback, useRef } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { recordingSessionService } from '@/features/audio/services/recording-session.service';
import { StudioBackingPlayers } from '@/features/studio/components/multitrack/studio-backing-players';
import { MultitrackLayerStack } from '@/features/studio/components/multitrack/multitrack-layer-stack';
import { QuickRecordProcessingOverlay } from '@/features/studio/components/quick-record-processing-overlay';
import { QuickRecordTimer } from '@/features/studio/components/quick-record-timer';
import { QuickRecordToolRow } from '@/features/studio/components/quick-record-tool-row';
import { QuickRecordTransport } from '@/features/studio/components/quick-record-transport';
import { QuickRecordTimeline } from '@/features/studio/components/quick-record-waveform';
import { useMultitrackStudioScreen } from '@/features/studio/hooks/use-multitrack-studio-screen';
import { Text } from '@/shared/components/ui/text';

/**
 * Multitrack Studio — Studio Noir shell wired to the shared project session.
 * One shared timer/ruler/playhead; layers are offset clips inside the 30s window.
 */
export function MultitrackStudioScreen() {
  const insets = useSafeAreaInsets();
  const session = useMultitrackStudioScreen();
  const {
    studio,
    playback,
    duration,
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
    discard,
    leave,
    setFxProcessing,
    overlayVisible,
    overlayTitle,
    hasTake,
  } = session;

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

  const onBack = () => {
    if (!studio.shouldPromptBeforeLeaving()) {
      leave();
      return;
    }
    Alert.alert('Discard session?', 'Leave without saving this multitrack session?', [
      { text: 'Keep editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          void discard();
        },
      },
    ]);
  };

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
            onPress={onBack}
            className="h-10 w-10 items-center justify-center rounded-full active:bg-surface-bright">
            <ArrowLeft size={20} color="#E4E1EA" strokeWidth={2} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Rename session"
            className="max-w-[60%] flex-row items-center gap-1.5 active:opacity-80">
            <Text variant="title-md" className="text-on-surface" numberOfLines={1}>
              Untitled Session
            </Text>
            <Pencil size={14} color="#CBC3D7" strokeWidth={2} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="More options"
            hitSlop={8}
            onPress={() => {
              Alert.alert('Session', undefined, [
                {
                  text: 'Discard',
                  style: 'destructive',
                  onPress: () => {
                    void discard();
                  },
                },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
            className="h-10 w-10 items-center justify-center rounded-full active:bg-surface-bright">
            <MoreVertical size={20} color="#E4E1EA" strokeWidth={2} />
          </Pressable>
        </View>
      </View>

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
          recordOriginSeconds={studio.recordOriginSeconds}
          windowStartSeconds={windowStartSeconds}
        />
        <View className="flex-1 pt-2">
          <MultitrackLayerStack
            layers={studio.project.layers}
            selectedLayerId={studio.project.selectedLayerId}
            durationSeconds={duration}
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
          initialEditChain={selected?.editChain}
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
          onSave={() => void save()}
          onTogglePlayback={togglePlayback}
          onToggleRecord={toggleRecord}
          onStopRecordPressIn={() => recordingSessionService.requestStop()}
        />
      </View>

      <StudioBackingPlayers
        tracks={studio.backingTracks}
        startAtSeconds={studio.recordOriginSeconds}
        playing={studio.isRecording}
        paused={false}
      />

      <QuickRecordProcessingOverlay visible={overlayVisible} title={overlayTitle} />
    </View>
  );
}
