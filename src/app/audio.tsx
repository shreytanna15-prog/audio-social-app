import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MOCK_RECORDINGS } from '@/module/audio/constants/mock-recordings';
import { PreviewSection } from '@/module/audio/components/preview-section';
import { RecorderSection } from '@/module/audio/components/recorder-section';
import { RecordingsList } from '@/module/audio/components/recordings-list';

export default function AudioScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <RecorderSection status="recording" timerSeconds={12} />
        <PreviewSection />
        <RecordingsList recordings={MOCK_RECORDINGS} />
      </ScrollView>
    </View>
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
