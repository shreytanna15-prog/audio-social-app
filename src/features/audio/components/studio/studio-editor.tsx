import { useCallback, useRef } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { RecordingEditorActions } from '@/features/audio/components/recording-editor-actions';
import { RecordingOptimizeOverlay } from '@/features/audio/components/recording-optimize-overlay';
import { StudioBackingPlayers } from '@/features/audio/components/studio/studio-backing-players';
import { StudioTrackStack } from '@/features/audio/components/studio/studio-track-stack';
import { StudioTransport } from '@/features/audio/components/studio/studio-transport';
import { VocalLayerFx } from '@/features/audio/components/studio/vocal-layer-fx';
import { useRecordingEditorUnsavedGuard } from '@/features/audio/hooks/use-recording-editor-unsaved-guard';
import { useStudioPlayback } from '@/features/audio/hooks/use-studio-playback';
import { useStudioSession } from '@/features/audio/hooks/use-studio-session';
import { MAX_PROJECT_LAYERS } from '@/features/audio/types/project';
import type { StudioEditorProps } from '@/features/audio/types/studio';

export function StudioEditor(props: StudioEditorProps) {
  const studio = useStudioSession(props);

  useRecordingEditorUnsavedGuard({
    enabled: props.isPending,
    shouldPrompt: studio.shouldPromptBeforeLeaving,
    onSave: studio.persistPendingWork,
  });

  // The mic take owns the audio thread, so the transport is torn down for the
  // duration rather than left polling its players alongside the capture.
  const playback = useStudioPlayback(
    studio.playbackTracks,
    studio.durationSeconds,
    !studio.isRecording,
  );

  const { title, isPending, isSaving } = props;
  const duration = Math.max(studio.durationSeconds, playback.duration);
  const selected = studio.current;
  const busy = isSaving || studio.isOptimizing;
  const canEditLayers = !busy && !studio.isRecording && !studio.isImportingBeat;
  const canAddLayer = studio.canAdd && canEditLayers;
  // FX render from the layer's baseline, so they stay locked until the gate has
  // swapped that baseline in — otherwise the render is built on a dead file.
  const isCleaningSelected = selected != null && studio.cleaningLayerIds.includes(selected.id);
  const playbackRef = useRef(playback);
  playbackRef.current = playback;
  const fxResumeRef = useRef<{ at: number; play: boolean } | null>(null);

  const handleFxProcessingChange = useCallback((processing: boolean) => {
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

    // Stem replace lands after this callback. Seek the new file, not 0:00.
    setTimeout(() => {
      const next = playbackRef.current;
      next.seekTo(resume.at);
      if (resume.play) {
        next.play();
      }
    }, 80);
  }, []);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.layerCount}>
            {studio.project.layers.length}/{MAX_PROJECT_LAYERS} layers
          </Text>
        </View>

        <StudioTrackStack
          layers={studio.project.layers}
          selectedLayerId={selected?.id ?? null}
          currentTime={playback.currentTime}
          durationSeconds={duration}
          liveLayerId={
            studio.isRecording || studio.isOptimizing ? studio.recordingLayerId : null
          }
          liveOffsetMs={Math.round(studio.recordOriginSeconds * 1000)}
          recordOriginSeconds={studio.recordOriginSeconds}
          isRecording={studio.isRecording}
          followPlayhead={playback.isPlaying || studio.isRecording}
          canEdit={canEditLayers}
          cleaningLayerIds={studio.cleaningLayerIds}
          importingLabel={studio.isImportingBeat ? 'Importing beat…' : null}
          onSelect={studio.selectLayer}
          onToggleMute={studio.toggleMute}
          onRemove={studio.removeLayer}
          onScrub={studio.isRecording ? () => undefined : playback.seekTo}
        />

        <View style={styles.layerActions}>
          <LayerActionButton
            label="Add Layer"
            icon={{ ios: 'plus', android: 'add', web: 'add' }}
            disabled={!canAddLayer}
            onPress={() => void studio.addVocalLayer()}
          />
          <LayerActionButton
            label="Add Beat"
            icon={{ ios: 'music.note', android: 'music_note', web: 'music_note' }}
            disabled={!canAddLayer}
            onPress={() => void studio.addBeat()}
          />
        </View>

        <StudioTransport
          isRecording={studio.isRecording}
          isPaused={studio.isPaused}
          isPlaying={playback.isPlaying}
          disabled={busy || studio.isImportingBeat}
          onRecord={() => {
            playback.pause();
            studio.handleRecordPress('playhead', playback.currentTime);
          }}
          onStop={studio.handleStopPress}
          onRecordFromStart={() => {
            playback.seekTo(0);
            playback.pause();
            studio.handleRecordPress('start', 0);
          }}
          onPauseResume={studio.handlePauseResume}
          onTogglePlay={() => {
            if (!playback.hasTracks) {
              Alert.alert('Nothing to play', 'Record, add a beat, or unmute a layer first.');
              return;
            }
            playback.togglePlayback();
          }}
        />

        {studio.isRecording ? (
          <Text style={styles.hint}>
            Recording. FX come back when you stop — they need a finished take.
          </Text>
        ) : selected?.kind === 'vocal' && selected.stemUri && selected.baselineUri ? (
          <>
            <VocalLayerFx
              key={selected.id}
              layerId={selected.id}
              baselineUri={selected.baselineUri}
              stemUri={selected.stemUri}
              sourceUri={selected.sourceUri}
              initialEditChain={selected.editChain}
              durationSeconds={selected.durationSeconds}
              isSaving={isSaving || studio.isOptimizing || isCleaningSelected}
              onStemChange={studio.applyVocalStem}
              onProcessingChange={handleFxProcessingChange}
            />
            {isCleaningSelected ? (
              <Text style={styles.hint}>
                Cleaning this take in the background — FX unlock when it finishes.
              </Text>
            ) : null}
          </>
        ) : selected && selected.kind !== 'vocal' ? (
          <Text style={styles.hint}>
            Beats and imported audio stay dry. Select a vocal layer to use FX.
          </Text>
        ) : (
          <Text style={styles.hint}>
            Recording stops the instant you tap Stop. Cleanup runs afterwards.
          </Text>
        )}

        {studio.persistStatus === 'saving' ? (
          <Text style={styles.hint}>Saving…</Text>
        ) : null}
        {studio.persistStatus === 'error' ? (
          <Text style={styles.error}>Couldn&apos;t save automatically. Tap Done to retry.</Text>
        ) : null}

        <RecordingEditorActions
          isPending={isPending}
          canReset={false}
          isSaving={isSaving}
          isProcessing={studio.isOptimizing}
          onReset={() => undefined}
          onDiscard={() => void studio.handleDiscard()}
          onSave={() => void studio.handleDone()}
        />
      </ScrollView>

      <StudioBackingPlayers
        tracks={studio.backingTracks}
        startAtSeconds={studio.recordOriginSeconds}
        playing={studio.isRecording}
        paused={studio.isPaused}
      />
      <RecordingOptimizeOverlay
        visible={studio.isOptimizing}
        title="Saving take…"
        detail="Recording stopped. Cleanup runs in the background afterwards."
      />
    </View>
  );
}

type LayerActionButtonProps = {
  label: string;
  icon: SymbolViewProps['name'];
  disabled: boolean;
  onPress: () => void;
};

function LayerActionButton({ label, icon, disabled, onPress }: LayerActionButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.layerButton,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}>
      <SymbolView name={icon} size={15} tintColor="#1A73E8" />
      <Text style={styles.layerButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  scroll: {
    flex: 1,
  },
  container: {
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1D21',
  },
  layerCount: {
    fontSize: 12,
    color: '#7A7F87',
    fontVariant: ['tabular-nums'],
  },
  layerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  layerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E4EA',
  },
  layerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1D21',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonPressed: {
    backgroundColor: '#F1F5FB',
  },
  hint: {
    fontSize: 13,
    color: '#7A7F87',
    textAlign: 'center',
  },
  error: {
    fontSize: 12,
    color: '#C62828',
    textAlign: 'center',
  },
});
