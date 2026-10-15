import { useCallback, useEffect, useRef, useState } from 'react';

import { discardPreviewRecording } from '@/features/audio/data/recording-repository';
import { peakBarCountForDuration } from '@/features/audio/domain/timeline';
import { extractPeaksFromWav } from '@/features/audio/services/peak-extract.service';
import { recordingSessionService } from '@/features/audio/services/recording-session.service';
import type { AudioProject } from '@/features/audio/types/project';

type SoftCleanSwap = {
  layerId: string;
  cleanedUri: string;
  peaks: number[];
};

type UseSoftCleanQueueOptions = {
  getProject: () => AudioProject;
  onProjectChange: (project: AudioProject) => void;
};

/**
 * Queues soft-gate passes so native work never overlaps, and Done can await
 * the chain. Stale results (re-record / FX / remove) are discarded.
 */
export function useSoftCleanQueue({
  getProject,
  onProjectChange,
}: UseSoftCleanQueueOptions) {
  const [cleaningLayerIds, setCleaningLayerIds] = useState<string[]>([]);
  const cleanQueueRef = useRef<Promise<void>>(Promise.resolve());
  const mountedRef = useRef(true);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  const enqueueSoftClean = useCallback(
    (layerId: string, rawUri: string) => {
      setCleaningLayerIds((ids) => (ids.includes(layerId) ? ids : [...ids, layerId]));

      // Must never reject: callers await this chain before save.
      cleanQueueRef.current = cleanQueueRef.current.then(async () => {
        try {
          const cleanedUri = await recordingSessionService.softClean(rawUri);

          if (!cleanedUri || !mountedRef.current) {
            return;
          }

          const layer = getProject().layers.find((item) => item.id === layerId);
          const untouched = layer?.stemUri === rawUri && layer?.sourceUri === rawUri;

          if (!untouched) {
            await discardPreviewRecording(cleanedUri);
            return;
          }

          const peaks = await extractPeaksFromWav(
            cleanedUri,
            peakBarCountForDuration(layer.durationSeconds),
          );

          if (!mountedRef.current) {
            return;
          }

          const latest = getProject();
          const stillUntouched = latest.layers.some(
            (item) =>
              item.id === layerId &&
              item.stemUri === rawUri &&
              item.sourceUri === rawUri,
          );
          if (!stillUntouched) {
            await discardPreviewRecording(cleanedUri);
            return;
          }

          const swap: SoftCleanSwap = { layerId, cleanedUri, peaks };
          onProjectChange({
            ...latest,
            layers: latest.layers.map((item) =>
              item.id === swap.layerId
                ? {
                    ...item,
                    stemUri: swap.cleanedUri,
                    baselineUri: swap.cleanedUri,
                    peaks: swap.peaks,
                  }
                : item,
            ),
          });
        } catch (error) {
          console.warn('[Optimize] soft clean swap failed; keeping raw take.', error);
        } finally {
          if (mountedRef.current) {
            setCleaningLayerIds((ids) => ids.filter((id) => id !== layerId));
          }
        }
      });
    },
    [getProject, onProjectChange],
  );

  const awaitSoftCleanQueue = useCallback(async () => {
    await cleanQueueRef.current;
  }, []);

  return {
    cleaningLayerIds,
    enqueueSoftClean,
    awaitSoftCleanQueue,
  };
}
