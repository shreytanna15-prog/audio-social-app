import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import { cacheDirectory } from 'expo-file-system/legacy';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/core/api/errors';
import { persistFile } from '@/features/audio/data/file-persist';
import { trimToFeedClipAac } from '@/features/audio/services/feed-clip-ffmpeg.service';
import { getTrack } from '@/features/tracks';
import { ScreenHeader } from '@/shared/components/layout/screen-header';
import { Button } from '@/shared/components/ui/button';
import { useFeedbackDialog } from '@/shared/components/ui/feedback-dialog';
import { Text } from '@/shared/components/ui/text';

import { getFeedClipForTrack } from '../api/service';
import { useCreateFeedClip } from '../api/hooks';

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
  const { showError } = useFeedbackDialog();
  const createClip = useCreateFeedClip();
  const params = useLocalSearchParams<{ trackId?: string | string[] }>();
  const trackId = Array.isArray(params.trackId)
    ? params.trackId[0]
    : params.trackId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [localMixUri, setLocalMixUri] = useState<string | null>(null);
  const [trackDurationMs, setTrackDurationMs] = useState(0);
  const [startMs, setStartMs] = useState(0);
  const [durationMs, setDurationMs] = useState(15_000);

  const endMs = startMs + durationMs;
  const maxStartMs = Math.max(0, trackDurationMs - MIN_MS);

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
        setTitle(track.title);
        setTrackDurationMs(duration);
        setLocalMixUri(mixDest);
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

  const nudgeStart = (deltaMs: number) => {
    setStartMs((prev) => clamp(prev + deltaMs, 0, maxStartMs));
  };

  const nudgeDuration = (deltaMs: number) => {
    setDurationMs((prev) => {
      const next = clamp(prev + deltaMs, MIN_MS, MAX_MS);
      setStartMs((start) => clamp(start, 0, Math.max(0, trackDurationMs - next)));
      return next;
    });
  };

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
              Pick a 10–30s hook. Preview loops the selection.
            </Text>
            <Text variant="label-md" className="font-semibold text-primary-tonal">
              {selectionLabel}
            </Text>
          </View>

          <View className="h-10 justify-center overflow-hidden rounded-full bg-surface-container-highest">
            <View
              className="absolute top-0 bottom-0 rounded-full bg-primary-tonal/70"
              style={{
                left: `${trackDurationMs > 0 ? (startMs / trackDurationMs) * 100 : 0}%`,
                width: `${trackDurationMs > 0 ? (durationMs / trackDurationMs) * 100 : 20}%`,
              }}
            />
          </View>

          <View className="rounded-2xl bg-surface-container-high px-3 py-4" style={{ gap: 14 }}>
            <Text variant="label-md" className="text-on-surface">
              Start
            </Text>
            <View className="flex-row items-center justify-between">
              <NudgeButton label="−1s" onPress={() => nudgeStart(-1000)} />
              <NudgeButton label="−0.1s" onPress={() => nudgeStart(-100)} />
              <NudgeButton label="+0.1s" onPress={() => nudgeStart(100)} />
              <NudgeButton label="+1s" onPress={() => nudgeStart(1000)} />
            </View>

            <Text variant="label-md" className="text-on-surface">
              Length
            </Text>
            <View className="flex-row items-center justify-between">
              <NudgeButton label="−1s" onPress={() => nudgeDuration(-1000)} />
              <NudgeButton label="−0.1s" onPress={() => nudgeDuration(-100)} />
              <NudgeButton label="+0.1s" onPress={() => nudgeDuration(100)} />
              <NudgeButton label="+1s" onPress={() => nudgeDuration(1000)} />
            </View>
          </View>

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
    </View>
  );
}

function NudgeButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="rounded-full bg-surface-container-highest px-3 py-2"
      hitSlop={6}>
      <Text variant="label-md" className="text-on-surface">
        {label}
      </Text>
    </Pressable>
  );
}
