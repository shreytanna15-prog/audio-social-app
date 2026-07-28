import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useAudioSessionStore } from '@/features/audio/store/audio-session.store';

export function useOpenEditorOnPreview(): void {
  const router = useRouter();
  const status = useAudioSessionStore((state) => state.status);
  const previewUri = useAudioSessionStore((state) => state.previewUri);
  const sourcePreGateUri = useAudioSessionStore((state) => state.sourcePreGateUri);
  const timerSeconds = useAudioSessionStore((state) => state.timerSeconds);
  const handoffToEditor = useAudioSessionStore((state) => state.handoffToEditor);
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    if (status !== 'preview') {
      isNavigatingRef.current = false;
      return;
    }

    if (!previewUri || isNavigatingRef.current) {
      return;
    }

    isNavigatingRef.current = true;

    const uri = previewUri;
    const sourceUri = sourcePreGateUri ?? '';
    const duration = String(timerSeconds);

    handoffToEditor();

    router.push({
      pathname: '/audio/recording/[id]',
      params: {
        id: 'new',
        uri,
        duration,
        ...(sourceUri ? { sourcePreGateUri: sourceUri } : {}),
      },
    });
  }, [
    status,
    previewUri,
    sourcePreGateUri,
    timerSeconds,
    handoffToEditor,
    router,
  ]);
}
