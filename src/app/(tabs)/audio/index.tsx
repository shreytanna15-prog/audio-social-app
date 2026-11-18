import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RecordingsList } from '@/features/audio/components';
import { StudioEntryToolbar } from '@/features/studio/components/multitrack/studio-entry-toolbar';
import { RecordingOptimizeOverlay } from '@/features/audio/components/recording-optimize-overlay';
import {
  pickAudioFile,
  prepareImportedAudio,
} from '@/features/audio/services/audio-import.service';
import { afterNextPaint } from '@/features/audio/utils/next-paint';
import { useFeedbackDialog } from '@/shared/components/ui/feedback-dialog';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

export default function AudioScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { guard } = useNavigationGuard();
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const busyRef = useRef(false);
  const { showError, dialog } = useFeedbackDialog();

  const openQuickRecord = useCallback(() => {
    guard(() => router.push('/studio/quick-record'));
  }, [router, guard]);

  const openImport = useCallback(async () => {
    if (busyRef.current) {
      return;
    }
    busyRef.current = true;
    setBusy(true);

    try {
      const picked = await pickAudioFile();
      if (!picked) {
        return;
      }

      setPreparing(true);
      await afterNextPaint();

      const staged = await prepareImportedAudio(picked.uri);

      guard(() =>
        router.push({
          pathname: '/audio/recording/[id]',
          params: {
            id: 'new',
            uri: staged.pendingUri,
            duration: String(staged.durationSeconds),
            sourcePreGateUri: staged.sourcePreGateUri,
            kind: 'import',
          },
        }),
      );
    } catch (error) {
      showError(
        'Import failed',
        error instanceof Error
          ? error.message
          : 'Could not import that audio file.',
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
      setPreparing(false);
    }
  }, [router, showError, guard]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.heading}>Audio</Text>
          <Text style={styles.subheading}>
            Start a take or bring in a track, then layer it in the studio.
          </Text>
        </View>
        <StudioEntryToolbar
          disabled={busy}
          onQuickRecord={openQuickRecord}
          onImportAudio={() => void openImport()}
        />
        <RecordingsList />
      </ScrollView>
      <RecordingOptimizeOverlay
        visible={preparing}
        title="Importing audio…"
        detail="Decoding and cleaning the track. Long songs take a few seconds."
      />
      {dialog}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    gap: 20,
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 40,
  },
  header: {
    gap: 6,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1D21',
    letterSpacing: -0.4,
  },
  subheading: {
    fontSize: 14,
    lineHeight: 20,
    color: '#7A7F87',
  },
});
