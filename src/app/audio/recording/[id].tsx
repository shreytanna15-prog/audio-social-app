import { Stack } from 'expo-router';

import { RecordingEditor } from '@/features/audio/components/recording-editor';
import { RecordingEditorScreenState } from '@/features/audio/components/recording-editor-screen-state';
import { useRecordingEditorRoute } from '@/features/audio/hooks/use-recording-editor-route';

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
      {/* Key by take URI so each new recording remounts editor state (Expo reuses /recording/new). */}
      <RecordingEditor
        key={routeState.editor.source.pristineUri}
        {...routeState.editor}
      />
    </>
  );
}