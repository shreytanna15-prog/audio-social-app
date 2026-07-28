import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RecorderSection, RecordingOptimizeOverlay, RecordingsList } from '@/features/audio/components';
import { useAudioRecorderBinding } from '@/features/audio/hooks/use-audio-recorder-binding';
import { useOpenEditorOnPreview } from '@/features/audio/hooks/use-open-editor-on-preview';
import { useAudioSessionStore } from '@/features/audio/store';

export default function AudioScreen() {
  const insets = useSafeAreaInsets();
  const isOptimizing = useAudioSessionStore((state) => state.status === 'optimizing');
  useAudioRecorderBinding();
  useOpenEditorOnPreview();

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <RecorderSection />
        <RecordingsList />
      </ScrollView>
      <RecordingOptimizeOverlay visible={isOptimizing} />
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
