import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';

type RecordingOptimizeOverlayProps = {
  visible: boolean;
};

export function RecordingOptimizeOverlay({ visible }: RecordingOptimizeOverlayProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#1A73E8" />
          <Text style={styles.title}>Optimizing your recording</Text>
          <Text style={styles.subtitle}>Cleaning background noise and enhancing voice…</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1D21',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#7A7F87',
    textAlign: 'center',
  },
});
