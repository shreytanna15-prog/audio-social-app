import { StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@/module/audio/components/icon-button';

export function PreviewActions() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Preview</Text>
      <View style={styles.actions}>
        <IconButton
          icon={{
            ios: 'play.fill',
            android: 'play_arrow',
            web: 'play_arrow',
          }}
        />
        <IconButton
          icon={{
            ios: 'arrow.clockwise',
            android: 'refresh',
            web: 'refresh',
          }}
        />
        <IconButton
          icon={{
            ios: 'square.and.arrow.down',
            android: 'save',
            web: 'save',
          }}
          variant="primary"
          size={24}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1D21',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
});
