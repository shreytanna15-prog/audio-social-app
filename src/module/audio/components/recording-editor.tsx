import { Alert, StyleSheet, Text, View } from 'react-native';

import {
  EffectChipRow,
  IconButton,
  RecordingEditorActions,
  RecordingTimer,
  WaveformDisplay,
} from '@/module/audio/components';
import { useRecordingEditorSession } from '@/module/audio/hooks/use-recording-editor-session';
import type { RecordingEditorMode } from '@/module/audio/types/recording-editor-route';

const PLACEHOLDER_BARS = [0.25, 0.4, 0.65, 0.5, 0.8, 0.55, 0.7, 0.45, 0.6, 0.35, 0.75, 0.5];

type RecordingEditorProps = {
  mode: RecordingEditorMode;
  originalUri: string;
  durationSeconds: number;
  title: string;
  isSaving?: boolean;
  onSave: (sourceUri: string) => void;
  onDiscard: () => void;
};

export function RecordingEditor({
  mode,
  originalUri,
  durationSeconds,
  title,
  isSaving = false,
  onSave,
  onDiscard,
}: RecordingEditorProps) {
  const session = useRecordingEditorSession({
    originalUri,
    isSaving,
    onEffectError: (message) => Alert.alert('Effect failed', message),
  });

  const handleDiscard = async () => {
    await session.cleanupWorkingFile();
    onDiscard();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <RecordingTimer seconds={durationSeconds} />
      <WaveformDisplay height={120} bars={PLACEHOLDER_BARS} active={session.isPlaying} />

      {session.appliedEffectLabel ? (
        <Text style={styles.appliedEffect}>Applied: {session.appliedEffectLabel}</Text>
      ) : (
        <Text style={styles.hint}>Tap an effect to process this recording.</Text>
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
        selectedEffectId={session.selectedEffectId}
        onSelectEffect={session.applyEffect}
        disabled={isSaving}
        isProcessing={session.isProcessing}
        processingLabel={session.processingLabel}
      />

      <RecordingEditorActions
        mode={mode}
        canReset={session.canReset}
        isSaving={isSaving}
        onReset={() => void session.resetEffects()}
        onDiscard={() => void handleDiscard()}
        onSave={() => onSave(session.workingUri)}
      />
    </View>
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
