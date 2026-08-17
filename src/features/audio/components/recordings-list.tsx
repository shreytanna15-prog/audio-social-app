import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { RecordingCard } from '@/features/audio/components/recording-card';
import { useOpenRecordingEditor } from '@/features/audio/hooks/use-open-recording-editor';
import { useRecordingsStore } from '@/features/audio/store';

export function RecordingsList() {
  const recordings = useRecordingsStore((state) => state.recordings);
  const isLoading = useRecordingsStore((state) => state.isLoading);
  const openRecordingEditor = useOpenRecordingEditor();

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My recordings</Text>
      {isLoading ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        // A virtualized list cannot measure itself inside the screen's
        // ScrollView, so it only added clipping churn that desynced the
        // renderer on save. The list is short and never scrolls on its own.
        <View style={styles.list}>
          {recordings.length === 0 ? (
            <Text style={styles.empty}>No recordings yet</Text>
          ) : (
            recordings.map((item, index) => (
              <RecordingCard
                key={item.id}
                recording={item}
                index={index}
                onOpen={openRecordingEditor}
              />
            ))
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingTop: 8,
  },
  heading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1D21',
  },
  list: {
    gap: 10,
    paddingBottom: 24,
  },
  empty: {
    textAlign: 'center',
    color: '#7A7F87',
    paddingVertical: 24,
  },
  loader: {
    paddingVertical: 24,
  },
});
