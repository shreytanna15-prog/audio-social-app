import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import { cacheDirectory } from 'expo-file-system/legacy';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/core/api/errors';
import { persistFile } from '@/features/audio/data/file-persist';
import { peakBarCountForDuration } from '@/features/audio/domain/timeline';
import { extractPeaksFromWav } from '@/features/audio/services/peak-extract.service';
import { trimToFeedClipAac } from '@/features/audio/services/feed-clip-ffmpeg.service';
import { getTrack } from '@/features/tracks';
import { ScreenHeader } from '@/shared/components/layout/screen-header';
import { Button } from '@/shared/components/ui/button';
import { useFeedbackDialog } from '@/shared/components/ui/feedback-dialog';
import { Text } from '@/shared/components/ui/text';

import { useCreateFeedClip } from '../api/hooks';
import { getFeedClipForTrack } from '../api/service';
import { FeedClipTrimmer } from '../components/feed-clip-trimmer';

const MIN_MS = 10_000;
const MAX_MS = 30_000;
const ACCENT = '#D0BCFF';

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function formatMs(ms: number): string {
  const totalSec = ms / 1000;
  const m = Math.floor(totalSec / 60);
  const s = totalSec - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
}

export function CreateFeedClipScreen() {
  const insets = useSafeAreaInsets();
  const { back } = useRouter();
  const { showError, dialog } = useFeedbackDialog();
  const createClip = useCreateFeedClip();
  const params = useLocalSearchParams<{ trackId?: string | string[] }>();
  const trackId = Array.isArray(params.trackId)
    ? params.trackId[0]
    : params.trackId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [localMixUri, setLocalMixUri] = useState<string | null>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [trackDurationMs, setTrackDurationMs] = useState(0);
  const [startMs, setStartMs] = useState(0);
  const [durationMs, setDurationMs] = useState(15_000);

  const endMs = startMs + durationMs;

  const player = useAudioPlayer(
    localMixUri ? { uri: localMixUri } : null,
    { updateInterval: 100, downloadFirst: true },
  );
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: false,
      interruptionMode: 'duckOthers',
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!trackId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        setLoading(true);
        const track = await getTrack(trackId);
        if (cancelled) return;
        if (!track.mixUrl) {
          throw new Error('This track has no mix audio to clip.');
        }
        if (!cacheDirectory) {
          throw new Error('Cache directory unavailable.');
        }

        const mixDest = `${cacheDirectory}feed-clip-src-${trackId}.wav`;
        await persistFile(track.mixUrl, mixDest);
        if (cancelled) return;

        const duration = Math.max(MIN_MS, track.durationMs);
        const existing = await getFeedClipForTrack(trackId);
        if (cancelled) return;

        const initialDuration = clamp(
          existing?.durationMs ?? Math.min(MAX_MS, duration),
          MIN_MS,
          MAX_MS,
        );
        const initialStart = clamp(
          existing?.startMs ?? 0,
          0,
          Math.max(0, duration - initialDuration),
        );

        const extracted = await extractPeaksFromWav(
          mixDest,
          peakBarCountForDuration(duration / 1000),
        );
        if (cancelled) return;

        setTitle(track.title);
        setTrackDurationMs(duration);
        setLocalMixUri(mixDest);
        setPeaks(extracted.length > 0 ? extracted : [0.3, 0.5, 0.4, 0.7, 0.45]);
        setStartMs(initialStart);
        setDurationMs(initialDuration);
      } catch (error) {
        if (!cancelled) {
          showError(
            'Could not open clip editor',
            getErrorMessage(error, 'Try again from Library.'),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [trackId, showError]);

  // Loop the selected window while previewing.
  useEffect(() => {
    if (!localMixUri || !status.isLoaded) return;
    const currentMs = (status.currentTime ?? 0) * 1000;
    if (currentMs < startMs - 40) {
      void player.seekTo(startMs / 1000);
      return;
    }
    if (currentMs >= endMs - 40) {
      void player.seekTo(startMs / 1000);
      if (status.playing) player.play();
    }
  }, [
    localMixUri,
    status.isLoaded,
    status.currentTime,
    status.playing,
    startMs,
    endMs,
    player,
  ]);

  const selectionLabel = useMemo(
    () =>
      `${formatMs(startMs)} → ${formatMs(endMs)}  (${(durationMs / 1000).toFixed(1)}s)`,
    [startMs, endMs, durationMs],
  );

  const playheadMs = status.playing
    ? (status.currentTime ?? 0) * 1000
    : undefined;

  const togglePreview = () => {
    if (!localMixUri) return;
    if (status.playing) {
      player.pause();
      return;
    }
    void player.seekTo(startMs / 1000).then(() => player.play());
  };

  const onSave = async () => {
    if (!trackId || !localMixUri || !cacheDirectory) return;
    try {
      setSaving(true);
      player.pause();
      const outUri = `${cacheDirectory}feed-clip-${trackId}.m4a`;
      await trimToFeedClipAac({
        inputUri: localMixUri,
        outputUri: outUri,
        startSec: startMs / 1000,
        durationSec: durationMs / 1000,
      });
      await createClip.mutateAsync({
        trackId,
        localClipUri: outUri,
        startMs,
        endMs: startMs + durationMs,
        durationMs,
      });
      showError('Clip added to Feed!', 'Listeners can discover this short now.');
      back();
    } catch (error) {
      showError(
        'Could not save clip',
        getErrorMessage(error, 'Check your connection and try again.'),
      );
    } finally {
      setSaving(false);
    }
  };

  if (!trackId) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text variant="body-md" className="text-center text-on-surface-variant">
          Missing trackId.
        </Text>
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
      <ScreenHeader title="Create Feed Clip" onBack={() => back()} />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={ACCENT} />
        </View>
      ) : (
        <View className="flex-1 px-4 pt-2" style={{ gap: 20 }}>
          <View style={{ gap: 6 }}>
            <Text variant="title-md" className="text-on-surface">
              {title || 'Untitled'}
            </Text>
            <Text variant="body-md" className="text-on-surface-variant">
              Drag the window like Instagram Stories music. 10–30s.
            </Text>
            <Text variant="label-md" className="font-semibold text-primary-tonal">
              {selectionLabel}
            </Text>
          </View>

          <FeedClipTrimmer
            peaks={peaks}
            trackDurationMs={trackDurationMs}
            startMs={startMs}
            durationMs={durationMs}
            playheadMs={playheadMs}
            onChange={({ startMs: nextStart, durationMs: nextDuration }) => {
              setStartMs(nextStart);
              setDurationMs(nextDuration);
            }}
          />

          <Button
            variant="secondary"
            onPress={togglePreview}
            disabled={!localMixUri}>
            <Text>{status.playing ? 'Pause preview' : 'Loop preview'}</Text>
          </Button>

          <View className="flex-1" />

          <Button onPress={() => void onSave()} disabled={saving || !localMixUri}>
            <Text>{saving ? 'Saving clip…' : 'Add to Feed'}</Text>
          </Button>
        </View>
      )}

      {dialog}
    </View>
  );
}
