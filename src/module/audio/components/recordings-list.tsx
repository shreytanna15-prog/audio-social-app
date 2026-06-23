import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { RecordingCard } from '@/module/audio/components/recording-card';
import { useRecordings } from '@/store';

export function RecordingsList() {
  const { recordings, isLoading } = useRecordings();

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My recordings</Text>
      {isLoading ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <FlatList
          data={recordings}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No recordings yet</Text>}
          renderItem={({ item, index }) => <RecordingCard recording={item} index={index} />}
        />
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
