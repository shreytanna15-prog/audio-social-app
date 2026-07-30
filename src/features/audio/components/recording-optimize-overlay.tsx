import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { getOptimizeOverlayCopy } from '@/features/audio/domain/recording-optimize-copy';

type RecordingOptimizeOverlayProps = {
  visible: boolean;
};

export function RecordingOptimizeOverlay({
  visible = false,
}: RecordingOptimizeOverlayProps) {
  if (!visible) {
    return null;
  }

  const { title } = getOptimizeOverlayCopy();

  return (
    <View style={styles.backdrop} pointerEvents="auto">
      <View style={styles.card}>
        <ActivityIndicator size="large" color="#1A73E8" />
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(26, 29, 33, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 28,
    gap: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1D21',
    textAlign: 'center',
  },
});
