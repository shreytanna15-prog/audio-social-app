import { Stack, useLocalSearchParams } from 'expo-router';

import { RecordingEditorScreenState } from '@/features/audio/components/recording-editor-screen-state';
import { StudioEditor } from '@/features/audio/components/studio/studio-editor';
import { useAudioRecorderBinding } from '@/features/audio/hooks/use-audio-recorder-binding';
import { useStudioRoute } from '@/features/audio/hooks/use-studio-route';

export default function RecordingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  useAudioRecorderBinding();
  const routeState = useStudioRoute();

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
