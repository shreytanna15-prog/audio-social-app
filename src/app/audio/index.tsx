import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RecorderSection, RecordingsList } from '@/module/audio/components';
import { useAudioRecorderBinding } from '@/module/audio/hooks/use-audio-recorder-binding';
import { useOpenEditorOnPreview } from '@/module/audio/hooks/use-open-editor-on-preview';

export default function AudioScreen() {
  const insets = useSafeAreaInsets();
  useAudioRecorderBinding();
  useOpenEditorOnPreview();

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <RecorderSection />
        <RecordingsList />
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
