import { useEffect, useRef, type MutableRefObject } from 'react';

import { useAudioSessionStore } from '@/features/audio/store/audio-session.store';

type UseTakeCaptureBridgeOptions = {
  enabled?: boolean;
  capturingLayerIdRef: MutableRefObject<string | null>;
  onAttach: (input: {
    layerId: string;
    stemUri: string;
    sourceUri: string | null;
    durationSeconds: number;
  }) => Promise<string>;
  onAttached: (layerId: string, attachedUri: string) => void;
  onSettled?: () => void;
};

/**
 * When the capture store reaches `preview`, hand off the staged URI to the
 * project attach pipeline and clear the session store.
 */
export function useTakeCaptureBridge({
  enabled = true,
  capturingLayerIdRef,
  onAttach,
  onAttached,
  onSettled,
}: UseTakeCaptureBridgeOptions) {
  const status = useAudioSessionStore((state) => state.status);
  const previewUri = useAudioSessionStore((state) => state.previewUri);
  const sourcePreGateUri = useAudioSessionStore((state) => state.sourcePreGateUri);
  const frozenDurationMillis = useAudioSessionStore((state) => state.frozenDurationMillis);
  const handoffToEditor = useAudioSessionStore((state) => state.handoffToEditor);
  const mountedRef = useRef(true);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  useEffect(() => {
    if (!enabled || status !== 'preview' || !previewUri) {
      return;
    }

    const layerId = capturingLayerIdRef.current;
    const stemUri = previewUri;
    const sourceUri = sourcePreGateUri;
    const takeDuration = frozenDurationMillis / 1000;
    capturingLayerIdRef.current = null;
    handoffToEditor();

    if (!layerId) {
      onSettled?.();
      return;
    }

    void onAttach({
      layerId,
      stemUri,
      sourceUri,
      durationSeconds: takeDuration,
    })
      .then((attachedUri) => {
        onAttached(layerId, attachedUri);
      })
      .catch((error: unknown) => {
        console.warn('[Studio] could not attach take to layer.', error);
      })
      .finally(() => {
        if (mountedRef.current) {
          onSettled?.();
        }
      });
  }, [
    capturingLayerIdRef,
    enabled,
    frozenDurationMillis,
    handoffToEditor,
    onAttach,
    onAttached,
    onSettled,
    previewUri,
    sourcePreGateUri,
    status,
  ]);
}
