import { StyleSheet, Text, View } from 'react-native';

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

  const { title, subtitle } = getOptimizeOverlayCopy();

  return (
    <View style={styles.backdrop} pointerEvents="auto">
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
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
    paddingVertical: 24,
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1D21',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#5C6370',
    textAlign: 'center',
    lineHeight: 20,
  },
});
