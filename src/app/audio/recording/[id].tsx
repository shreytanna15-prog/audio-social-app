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
      <Stack.Screen options={{ title: routeState.screenTitle }} />
      <RecordingEditor
        mode={routeState.mode}
        pristineUri={routeState.pristineUri}
        playbackUri={routeState.playbackUri}
        initialAppliedEffects={routeState.initialAppliedEffects}
        durationSeconds={routeState.durationSeconds}
        title={routeState.contentTitle}
        isSaving={routeState.isSaving}
        onSave={routeState.onSave}
        onDiscard={routeState.onDiscard}
      />
    </>
  );
}