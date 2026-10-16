import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

type QuickRecordProcessingOverlayProps = {
  visible: boolean;
  title?: string;
  detail?: string;
};

/** Blocking overlay while finalize / SpectralGate soft-clean runs. */
export function QuickRecordProcessingOverlay({
  visible,
  title = 'Cleaning take…',
  detail = 'This usually takes a few seconds.',
}: QuickRecordProcessingOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.backdrop} pointerEvents="auto">
      <View style={styles.card}>
        <ActivityIndicator size="large" color="#A078FF" />
        <Text variant="title-md" className="text-center text-on-surface">
          {title}
        </Text>
        {detail ? (
          <Text variant="body-md" className="text-center text-on-surface-variant">
            {detail}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(12, 10, 18, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#211F26',
    paddingHorizontal: 22,
    paddingVertical: 28,
    gap: 12,
    alignItems: 'center',
  },
});
