import { Alert, StyleSheet, Text, View } from 'react-native';

import { EffectChipRow } from '@/features/audio/components/effect-chip-row';
import { EffectSettingsDrawer } from '@/features/audio/components/effect-settings-drawer';
import { IconButton } from '@/features/audio/components/icon-button';
import { RecordingEditorActions } from '@/features/audio/components/recording-editor-actions';
import { RecordingTimer } from '@/features/audio/components/recording-timer';
import { WaveformDisplay } from '@/features/audio/components/waveform-display';
import { useRecordingEditorSession } from '@/features/audio/hooks/use-recording-editor-session';
import type { RecordingEditorProps } from '@/features/audio/types/recording-editor';

const PLACEHOLDER_BARS = [0.25, 0.4, 0.65, 0.5, 0.8, 0.55, 0.7, 0.45, 0.6, 0.35, 0.75, 0.5];

export function RecordingEditor({
  source,
  title,
  durationSeconds,
  isPending,
  isSaving = false,
  onSave,
  onDiscard,
}: RecordingEditorProps) {
  const session = useRecordingEditorSession({
    ...source,
    isSaving,
    onEffectError: ({ title: errorTitle, message }) => {
      Alert.alert(errorTitle, message);
    },
  });

  const handleDiscard = async () => {
    await session.cleanupWorkingFile();
    onDiscard();
  };

  const handleSave = async () => {
    await onSave({
      sourceUri: session.workingUri,
      appliedEffects: session.appliedEffects,
    });

    await session.cleanupWorkingFile();
  };

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <RecordingTimer seconds={durationSeconds} />
        <WaveformDisplay height={120} bars={PLACEHOLDER_BARS} active={session.isPlaying} />
        {session.effectLabel ? (
          <Text style={styles.appliedEffect}>Applied: {session.effectLabel}</Text>
        ) : (
          <Text style={styles.hint}>Tap an effect below to add it or open its settings.</Text>
        )}
        <View style={styles.playRow}>
          <IconButton
            icon={{
              ios: session.isPlaying ? 'pause.fill' : 'play.fill',
              android: session.isPlaying ? 'pause' : 'play_arrow',
              web: session.isPlaying ? 'pause' : 'play_arrow',
            }}
            variant="primary"
            size={28}
            onPress={session.togglePlayback}
            disabled={session.isPlaybackDisabled}
          />
        </View>
        <EffectChipRow
          selectedEffectIds={session.selectedEffectIds}
          onEffectPress={(effectId) => session.pressEffect(effectId)}
          disabled={isSaving}
          isProcessing={session.isProcessing}
          processingLabel={session.processingLabel}
        />
        <RecordingEditorActions
          isPending={isPending}
          canReset={session.canReset}
          isSaving={isSaving}
          onReset={() => void session.resetEffects()}
          onDiscard={() => void handleDiscard()}
          onSave={() => void handleSave()}
        />
      </View>

      <EffectSettingsDrawer
        visible={session.drawerEffectId !== null}
        effectId={session.drawerEffectId}
        initialParams={session.drawerInitialParams}
        isProcessing={session.isProcessing}
        isActive={session.isDrawerEffectActive}
        onClose={session.closeEffectDrawer}
        onApply={(params) => {
          if (!session.drawerEffectId) {
            return;
          }

          void session.applyEffectFromDrawer(session.drawerEffectId, params);
        }}
        onRemove={
          session.drawerEffectId
            ? () => void session.removeEffectFromDrawer(session.drawerEffectId!)
            : undefined
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1D21',
  },
  hint: {
    fontSize: 13,
    color: '#7A7F87',
    textAlign: 'center',
  },
  appliedEffect: {
    fontSize: 13,
    color: '#1A73E8',
    textAlign: 'center',
    fontWeight: '500',
  },
  playRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
});
