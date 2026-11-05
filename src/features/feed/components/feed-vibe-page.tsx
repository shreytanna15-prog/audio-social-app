import { Image } from 'expo-image';
import { Play } from 'lucide-react-native';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Pressable, Share, View } from 'react-native';

import type { FeedVibe } from '../types';
import { FeedNextVibeTeaser } from './feed-next-vibe-teaser';
import { FeedOpenTrackCta } from './feed-open-track-cta';
import {
  FeedPreviewTimeRow,
  FeedWaveformBars,
} from './feed-preview-controls';
import { FeedSocialRail } from './feed-social-rail';
import { FeedVibeMeta } from './feed-vibe-meta';

export type FeedVibePlaybackView = {
  progress: number;
  currentSec: number;
  previewDurationSec: number;
  completedOnce: boolean;
  userPaused?: boolean;
};

type FeedVibePageProps = {
  vibe: FeedVibe;
  nextVibe: FeedVibe | null;
  isActive: boolean;
  pageHeight: number;
  playback: FeedVibePlaybackView;
  onTogglePlayPause?: () => void;
  onOpenFullTrack: (vibe: FeedVibe) => void;
  onArtistPress?: (vibe: FeedVibe) => void;
};

export function FeedVibePage({
  vibe,
  nextVibe,
  isActive,
  pageHeight,
  playback,
  onTogglePlayPause,
  onOpenFullTrack,
  onArtistPress,
}: FeedVibePageProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  /**
   * Next Up only after a full play on this visit. Hidden before paint when
   * leaving; shown only on a false→true `completedOnce` edge while active.
   */
  const [showNextTeaser, setShowNextTeaser] = useState(false);
  const armedForCompleteRef = useRef(false);

  useLayoutEffect(() => {
    setShowNextTeaser(false);
    armedForCompleteRef.current = false;
  }, [isActive, vibe.id]);

  useEffect(() => {
    if (!isActive || nextVibe == null) {
      setShowNextTeaser(false);
      armedForCompleteRef.current = false;
      return;
    }

    if (!playback.completedOnce) {
      // Fresh visit (or reset) — arm so the next complete can show Next Up
      armedForCompleteRef.current = true;
      setShowNextTeaser(false);
      return;
    }

    if (armedForCompleteRef.current) {
      setShowNextTeaser(true);
      armedForCompleteRef.current = false;
    }
  }, [isActive, nextVibe, playback.completedOnce]);
  /**
   * Feed page height already ends above AppTabBar (mini player + tabs).
   * Small inset so Next Up doesn’t sit flush on the mini-player edge.
   */
  const bottomPad = 22;
  /** Same vertical rhythm: meta → waveform, and waveform block → Open Full Track */
  const sectionGap = 28;

  const showPausedGlyph = isActive && !!playback.userPaused;

  return (
    <View style={{ height: pageHeight }} className="relative overflow-hidden bg-background">
      <Image
        source={{ uri: vibe.coverUrl }}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        contentFit="cover"
        priority={isActive ? 'high' : 'normal'}
        recyclingKey={`${vibe.id}-cover`}
      />

      <View
        className="absolute inset-0"
        style={{
          experimental_backgroundImage:
            'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.55) 68%, rgba(0,0,0,0.88) 100%)',
        }}
        pointerEvents="none"
      />

      {/* Reels-style tap layer — behind controls so buttons stay tappable */}
      {isActive && onTogglePlayPause ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={playback.userPaused ? 'Play preview' : 'Pause preview'}
          onPress={onTogglePlayPause}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        />
      ) : null}

      {showPausedGlyph ? (
        <View
          className="absolute inset-0 z-5 items-center justify-center"
          pointerEvents="none">
          <View
            className="items-center justify-center rounded-full"
            style={{
              width: 72,
              height: 72,
              backgroundColor: 'rgba(0,0,0,0.45)',
            }}>
            <Play size={36} color="#FFFFFF" fill="#FFFFFF" />
          </View>
        </View>
      ) : null}

      <View
        className="absolute left-0 right-0 z-10 px-3"
        style={{ bottom: bottomPad, gap: sectionGap }}>
        <View className="gap-1">
          {/* Wave bar baseline aligns with save button baseline */}
          <View className="flex-row items-end gap-2">
            <View className="min-w-0 flex-1" style={{ gap: sectionGap }}>
              <FeedVibeMeta
                vibe={vibe}
                following={following}
                onFollowPress={() => setFollowing((prev) => !prev)}
                onArtistPress={onArtistPress ? () => onArtistPress(vibe) : undefined}
              />
              <FeedWaveformBars
                vibeId={vibe.id}
                peaks={vibe.waveformPeaks}
                progress={playback.progress}
                onPress={onTogglePlayPause}
                accessibilityLabel={
                  playback.userPaused ? 'Play preview' : 'Pause preview'
                }
              />
            </View>

            <FeedSocialRail
              likesLabel={vibe.likesLabel}
              commentsLabel={vibe.commentsLabel}
              sharesLabel={vibe.sharesLabel}
              liked={liked}
              saved={saved}
              onLikePress={() => setLiked((prev) => !prev)}
              onCommentPress={() => {
                /* comments sheet wired when feed API lands */
              }}
              onSharePress={() => {
                void Share.share({
                  message: `Check out ${vibe.title} by ${vibe.artist} on VibeOGram`,
                });
              }}
              onSavePress={() => setSaved((prev) => !prev)}
            />
          </View>

          <View className="pr-15">
            <FeedPreviewTimeRow
              currentSec={playback.currentSec}
              previewDurationSec={playback.previewDurationSec}
            />
          </View>
        </View>

        <FeedOpenTrackCta
          durationSec={vibe.durationSec}
          onOpenPress={() => onOpenFullTrack(vibe)}
        />

        {showNextTeaser && nextVibe ? (
          <View className="mt-1">
            <FeedNextVibeTeaser nextVibe={nextVibe} />
          </View>
        ) : null}
      </View>
    </View>
  );
}
