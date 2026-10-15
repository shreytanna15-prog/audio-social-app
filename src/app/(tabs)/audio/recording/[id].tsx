import { Stack, useLocalSearchParams } from 'expo-router';

import { RecordingEditorScreenState } from '@/features/audio/components/recording-editor-screen-state';
import { useAudioRecorderBinding } from '@/features/audio/hooks/use-audio-recorder-binding';
import { StudioEditor } from '@/features/studio/components/multitrack/studio-editor';
import { useMultitrackRoute } from '@/features/studio/hooks/use-multitrack-route';

export default function RecordingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  useAudioRecorderBinding();
  const routeState = useMultitrackRoute();

  if (routeState.status === 'loading') {
    return <RecordingEditorScreenState variant="loading" />;
  }

  if (routeState.status === 'error') {
    return (
      <>
        <Stack.Screen options={{ title: 'Recording' }} />
        <RecordingEditorScreenState variant="error" />
      </>
    );
  }

  const editorKey = routeState.editor.isPending
    ? `pending-${routeState.editor.initialProject.layers[0]?.id ?? 'empty'}`
    : String(id);

  return (
    <>
      <Stack.Screen
        options={{
          title: routeState.editor.isPending ? 'New recording' : 'Edit recording',
        }}
      />
      <StudioEditor key={editorKey} {...routeState.editor} />
    </>
  );
}
