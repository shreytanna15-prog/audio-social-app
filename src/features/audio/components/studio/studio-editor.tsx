import { useCallback, useLayoutEffect, useRef } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RecordingOptimizeOverlay } from '@/features/audio/components/recording-optimize-overlay';
import { StudioBackingPlayers } from '@/features/audio/components/studio/studio-backing-players';
import { StudioTrackStack } from '@/features/audio/components/studio/studio-track-stack';
import { StudioTransport } from '@/features/audio/components/studio/studio-transport';
import { VocalLayerFx } from '@/features/audio/components/studio/vocal-layer-fx';
import { useRecordingEditorUnsavedGuard } from '@/features/audio/hooks/use-recording-editor-unsaved-guard';
import { useStudioPlayback } from '@/features/audio/hooks/use-studio-playback';
import { useStudioSession } from '@/features/audio/hooks/use-studio-session';
import type { StudioEditorProps } from '@/features/audio/types/studio';

export function StudioEditor(props: StudioEditorProps) {
  const studio = useStudioSession(props);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  useRecordingEditorUnsavedGuard({
    enabled: props.isPending,
    shouldPrompt: studio.shouldPromptBeforeLeaving,
    onSave: studio.persistPendingWork,
  });

  const playback = useStudioPlayback(
    studio.playbackTracks,
    studio.durationSeconds,
    !studio.isRecording,
  );

  const { isPending, isSaving } = props;
  const duration = Math.max(studio.durationSeconds, playback.duration);
  const selected = studio.current;
  const busy = isSaving || studio.isOptimizing;
  const canEditLayers = !busy && !studio.isRecording && !studio.isImportingBeat;
  const canAddLayer = studio.canAdd && canEditLayers;
  const isCleaningSelected = selected != null && studio.cleaningLayerIds.includes(selected.id);
  const showEffects = Boolean(selected?.stemUri) && !studio.isRecording;
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

    setTimeout(() => {
      const next = playbackRef.current;
      next.seekTo(resume.at);
      if (resume.play) {
        next.play();
      }
    }, 80);
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: '#F4F6F8' },
      headerShadowVisible: false,
      headerTintColor: '#1A1D21',
      headerTitleStyle: { color: '#1A1D21', fontWeight: '600' },
      headerRight: () => (
        <View style={styles.headerRight}>
          {isPending ? (
            <Pressable
              disabled={busy}
              onPress={() => {
                void studio.handleDiscard();
              }}
              hitSlop={8}
              style={({ pressed }) => [
                styles.headerButton,
                busy && styles.headerDisabled,
                pressed && !busy && styles.headerPressed,
              ]}>
              <Text style={styles.headerDiscardText}>Discard</Text>
            </Pressable>
          ) : null}
          <Pressable
            disabled={busy}
            onPress={() => {
              void studio.handleDone();
            }}
            hitSlop={8}
            style={({ pressed }) => [
              styles.headerButton,
              busy && styles.headerDisabled,
              pressed && !busy && styles.headerPressed,
            ]}>
            <Text style={styles.headerDoneText}>{isPending ? 'Save' : 'Done'}</Text>
          </Pressable>
        </View>
      ),
    });
  }, [busy, isPending, navigation, studio]);

  return (
    <View style={styles.screen}>
      <View style={styles.stage}>
        <StudioTrackStack
          layers={studio.project.layers}
          selectedLayerId={selected?.id ?? null}
          currentTime={playback.currentTime}
          durationSeconds={duration}
          liveLayerId={studio.recordingLayerId}
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
      </View>

      <View style={styles.spacer} />

      {studio.persistStatus === 'saving' ? (
        <Text style={styles.status}>Saving…</Text>
      ) : null}
      {studio.persistStatus === 'error' ? (
        <Text style={styles.error}>Couldn&apos;t save automatically. Tap Done to retry.</Text>
      ) : null}

      {showEffects && selected?.stemUri ? (
        <View style={styles.effects}>
          {isCleaningSelected ? <Text style={styles.effectsHint}>Cleaning…</Text> : null}
          <VocalLayerFx
            key={selected.id}
            layerId={selected.id}
            baselineUri={selected.baselineUri ?? selected.stemUri}
            stemUri={selected.stemUri}
            sourceUri={selected.sourceUri ?? selected.stemUri}
            initialEditChain={selected.editChain}
            durationSeconds={selected.durationSeconds}
            isSaving={isSaving || studio.isOptimizing || isCleaningSelected}
            onStemChange={studio.applyVocalStem}
            onProcessingChange={handleFxProcessingChange}
          />
        </View>
      ) : null}

      <View style={{ paddingBottom: Math.max(insets.bottom, 10) }}>
        <StudioTransport
          isRecording={studio.isRecording}
          isPlaying={playback.isPlaying}
          disabled={busy || studio.isImportingBeat}
          canAdd={canAddLayer}
          onAddLayer={() => {
            void studio.addVocalLayer();
          }}
          onAddBeat={() => {
            void studio.addBeat();
          }}
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
          onTogglePlay={() => {
            if (!playback.hasTracks) {
              Alert.alert('Nothing to play', 'Record, add a beat, or unmute a layer first.');
              return;
            }
            playback.togglePlayback();
          }}
        />
      </View>

      <StudioBackingPlayers
        tracks={studio.backingTracks}
        startAtSeconds={studio.recordOriginSeconds}
        playing={studio.isRecording}
        paused={false}
      />
      <RecordingOptimizeOverlay
        visible={studio.isOptimizing}
        title="Saving take…"
        detail="Recording stopped. Cleanup runs in the background afterwards."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  stage: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  spacer: {
    flex: 1,
    minHeight: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 4,
  },
  headerButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  headerDiscardText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#C62828',
  },
  headerDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A73E8',
  },
  headerDisabled: {
    opacity: 0.4,
  },
  headerPressed: {
    opacity: 0.7,
  },
  status: {
    textAlign: 'center',
    fontSize: 12,
    color: '#7A7F87',
    paddingVertical: 4,
  },
  error: {
    textAlign: 'center',
    fontSize: 12,
    color: '#C62828',
    paddingVertical: 4,
  },
  effects: {
    paddingHorizontal: 12,
    paddingBottom: 4,
    gap: 4,
  },
  effectsHint: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A73E8',
    paddingHorizontal: 4,
  },
});
