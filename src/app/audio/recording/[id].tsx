import { Stack } from 'expo-router';

import { RecordingEditor } from '@/module/audio/components/recording-editor';
import { RecordingEditorScreenState } from '@/module/audio/components/recording-editor-screen-state';
import { useRecordingEditorRoute } from '@/module/audio/hooks/use-recording-editor-route';

export default function RecordingScreen() {
  const routeState = useRecordingEditorRoute();

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

  return (
    <>
      <Stack.Screen options={{ title: routeState.editor.isPending ? "New recording" : "Edit recording" }} />
      <RecordingEditor {...routeState.editor} />
    </>
  );
}