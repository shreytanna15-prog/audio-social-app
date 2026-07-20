import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import type { RecordingMode } from '@/features/audio/types/recording-mode';
import { useAudioSessionStore } from '@/features/audio/store/audio-session.store';

function parseRecordingModeParam(value: RecordingMode | null): RecordingMode | undefined {
  // All known modes pass through so the editor can adjust defaults.
  if (
    value === 'speech' ||
    value === 'instrument' ||
    value === 'instrument-3' ||
    value === 'mixed' ||
    value === 'raw'
  ) {
    return value;
  }

  return undefined;
}

export function useOpenEditorOnPreview(): void {
  const router = useRouter();
  const status = useAudioSessionStore((state) => state.status);
  const previewUri = useAudioSessionStore((state) => state.previewUri);
  const timerSeconds = useAudioSessionStore((state) => state.timerSeconds);
  const recordingMode = useAudioSessionStore((state) => state.recordingMode);
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
    const duration = String(timerSeconds);
    const modeParam = parseRecordingModeParam(recordingMode);

    handoffToEditor();

    router.push({
      pathname: '/audio/recording/[id]',
      params: {
        id: 'new',
        uri,
        duration,
        ...(modeParam ? { recordingMode: modeParam } : {}),
      },
    });
  }, [status, previewUri, timerSeconds, recordingMode, handoffToEditor, router]);
}
