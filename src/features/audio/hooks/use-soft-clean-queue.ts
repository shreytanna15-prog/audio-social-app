import { useCallback, useEffect, useRef, useState } from 'react';

import { discardPreviewRecording } from '@/features/audio/data/recording-repository';
import { peakBarCountForDuration } from '@/features/audio/domain/timeline';
import { extractPeaksFromWav } from '@/features/audio/services/peak-extract.service';
import { recordingSessionService } from '@/features/audio/services/recording-session.service';
import type { AudioProject } from '@/features/audio/types/project';

type UseSoftCleanQueueOptions = {
  getProject: () => AudioProject;
  onProjectChange: (project: AudioProject) => void;
};

/**
 * Queues soft-gate passes so native work never overlaps, and Done can await
 * the chain. Stale results (re-record / FX / remove) are discarded.
 *
 * Busy UI clears as soon as SpectralGate finishes — peak rebuild must not
 * leave the "Cleaning take…" overlay stuck on long punch-in merges.
 */
export function useSoftCleanQueue({
  getProject,
  onProjectChange,
}: UseSoftCleanQueueOptions) {
  const [cleaningLayerIds, setCleaningLayerIds] = useState<string[]>([]);
  const cleanQueueRef = useRef<Promise<void>>(Promise.resolve());
  const mountedRef = useRef(true);
  /** Bumps when a newer take is enqueued for a layer — older jobs must not swap. */
  const cleanGenerationRef = useRef<Map<string, number>>(new Map());

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  const clearCleaning = useCallback((layerId: string) => {
    setCleaningLayerIds((ids) => ids.filter((id) => id !== layerId));
  }, []);

  const enqueueSoftClean = useCallback(
    (layerId: string, rawUri: string) => {
      const generation = (cleanGenerationRef.current.get(layerId) ?? 0) + 1;
      cleanGenerationRef.current.set(layerId, generation);

      setCleaningLayerIds((ids) => (ids.includes(layerId) ? ids : [...ids, layerId]));

      // Must never reject: callers await this chain before save.
      cleanQueueRef.current = cleanQueueRef.current.then(async () => {
        let clearedBusy = false;
        const releaseBusy = () => {
          if (clearedBusy) {
            return;
          }
          clearedBusy = true;
          // Only clear busy if this is still the latest job for the layer.
          if (cleanGenerationRef.current.get(layerId) === generation) {
            clearCleaning(layerId);
          }
        };

        try {
          if (cleanGenerationRef.current.get(layerId) !== generation) {
            return;
          }

          // Let the cleaningLayerIds add commit before softClean can finish.
          // Otherwise a fast failure (e.g. missing Superpowered key) can run
          // clearCleaning against [] and then the add wins → overlay stuck.
          await new Promise<void>((resolve) => setTimeout(resolve, 0));

          const cleanedUri = await recordingSessionService.softClean(rawUri);

          // Unblock UI immediately — peaks are secondary.
          releaseBusy();

          if (!cleanedUri) {
            console.warn('[Optimize] soft clean returned null; keeping raw take.');
            return;
          }

          if (cleanGenerationRef.current.get(layerId) !== generation) {
            await discardPreviewRecording(cleanedUri);
            return;
          }

          const layer = getProject().layers.find((item) => item.id === layerId);
          if (!layer) {
            await discardPreviewRecording(cleanedUri);
            return;
          }

          // Duplicate finish — already on this cleaned stem.
          if (layer.stemUri === cleanedUri) {
            return;
          }

          // Accept swap if the layer still points at the URI we cleaned as stem
          // OR as source (stem may already be an older cleaned file / missing).
          const canSwap =
            layer.stemUri === rawUri || layer.sourceUri === rawUri;

          if (!canSwap) {
            console.warn('[Optimize] soft clean stale; discarding cleaned file.', {
              layerId,
              stemUri: layer.stemUri,
              sourceUri: layer.sourceUri,
              rawUri,
            });
            await discardPreviewRecording(cleanedUri);
            return;
          }

          // Swap stem first so playback can remount; peaks follow.
          // Keep sourceUri as the pre-gate raw (rawUri) for punch-in / re-clean.
          const latestBeforePeaks = getProject();
          onProjectChange({
            ...latestBeforePeaks,
            layers: latestBeforePeaks.layers.map((item) =>
              item.id === layerId
                ? {
                    ...item,
                    stemUri: cleanedUri,
                    baselineUri: cleanedUri,
                    sourceUri: item.sourceUri ?? rawUri,
                  }
                : item,
            ),
          });

          const peaks = await extractPeaksFromWav(
            cleanedUri,
            peakBarCountForDuration(layer.durationSeconds),
          );

          if (!mountedRef.current) {
            return;
          }

          if (cleanGenerationRef.current.get(layerId) !== generation) {
            return;
          }

          const latest = getProject();
          const stillCleaned = latest.layers.some(
            (item) => item.id === layerId && item.stemUri === cleanedUri,
          );
          if (!stillCleaned) {
            return;
          }

          onProjectChange({
            ...latest,
            layers: latest.layers.map((item) =>
              item.id === layerId ? { ...item, peaks } : item,
            ),
          });
          console.warn('[Optimize] soft clean swap applied', layerId);
        } catch (error) {
          console.warn('[Optimize] soft clean swap failed; keeping raw take.', error);
        } finally {
          releaseBusy();
        }
      });
    },
    [clearCleaning, getProject, onProjectChange],
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
