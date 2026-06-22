import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PreviewSection, RecorderSection, RecordingsList } from '@/module/audio/components';
import { AudioSessionProvider, RecordingsProvider } from '@/module/audio/context';

export default function AudioScreen() {
  const insets = useSafeAreaInsets();

  return (
    <RecordingsProvider>
      <AudioSessionProvider>
        <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <RecorderSection />
            <PreviewSection />
            <RecordingsList />
          </ScrollView>
        </View>
      </AudioSessionProvider>
    </RecordingsProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
});
