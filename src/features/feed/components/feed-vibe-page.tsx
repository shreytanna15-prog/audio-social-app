import { Image } from 'expo-image';
import { Play } from 'lucide-react-native';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Pressable, Share, View } from 'react-native';

import { useFollowUser, useUnfollowUser } from '@/features/users';

import { useLikeFeedClip, useUnlikeFeedClip } from '../api/hooks';
import type { FeedVibe } from '../types';
import { FeedCommentsSheet } from './feed-comments-sheet';
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
  isFinished?: boolean;
};

type FeedVibePageProps = {
  vibe: FeedVibe;
  nextVibe: FeedVibe | null;
  isActive: boolean;
  pageHeight: number;
  playback: FeedVibePlaybackView;
  onTogglePlayPause?: () => void;
  onReplay?: () => void;
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
  onReplay,
  onOpenFullTrack,
  onArtistPress,
}: FeedVibePageProps) {
  const likeClip = useLikeFeedClip();
  const unlikeClip = useUnlikeFeedClip();
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();

  const [liked, setLiked] = useState(vibe.isLiked);
  const [likeCount, setLikeCount] = useState(vibe.likeCount);
  const [following, setFollowing] = useState(vibe.isFollowing);
  const [commentsOpen, setCommentsOpen] = useState(false);

  useEffect(() => {
    setLiked(vibe.isLiked);
    setLikeCount(vibe.likeCount);
    setFollowing(vibe.isFollowing);
  }, [vibe.id, vibe.isLiked, vibe.likeCount, vibe.isFollowing]);

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
      armedForCompleteRef.current = true;
      setShowNextTeaser(false);
      return;
    }

    if (armedForCompleteRef.current) {
      setShowNextTeaser(true);
      armedForCompleteRef.current = false;
    }
  }, [isActive, nextVibe, playback.completedOnce]);

  const bottomPad = 22;
  const sectionGap = 28;

  const showCenterGlyph =
    isActive && (!!playback.userPaused || !!playback.isFinished);

  const likesLabel =
    likeCount >= 1_000_000
      ? `${(likeCount / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
      : likeCount >= 1_000
        ? `${(likeCount / 1_000).toFixed(1).replace(/\.0$/, '')}k`
        : String(likeCount);

  return (
    <View style={{ height: pageHeight }} className="relative overflow-hidden bg-background">
      <Image
        source={{ uri: vibe.coverUrl }}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        contentFit="cover"
        blurRadius={48}
        priority={isActive ? 'high' : 'normal'}
        recyclingKey={`${vibe.id}-cover-blur`}
      />
      <View className="absolute inset-0 bg-background/55" pointerEvents="none" />

      {vibe.coverUrl ? (
        <View
          className="absolute left-0 right-0 items-center"
          style={{ top: pageHeight * 0.16 }}
          pointerEvents="none">
          <Image
            source={{ uri: vibe.coverUrl }}
            style={{
              width: Math.min(220, pageHeight * 0.28),
              height: Math.min(220, pageHeight * 0.28),
              borderRadius: 18,
              borderCurve: 'continuous',
            }}
            contentFit="cover"
            priority={isActive ? 'high' : 'normal'}
            recyclingKey={`${vibe.id}-cover-hero`}
          />
        </View>
      ) : null}

      <View
        className="absolute inset-0"
        style={{
          experimental_backgroundImage:
            'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.08) 35%, rgba(0,0,0,0.55) 68%, rgba(0,0,0,0.9) 100%)',
        }}
        pointerEvents="none"
      />

      {isActive && onTogglePlayPause ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={playback.userPaused ? 'Play preview' : 'Pause preview'}
          onPress={onTogglePlayPause}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        />
      ) : null}

      {showCenterGlyph ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={playback.isFinished ? 'Replay clip' : 'Play clip'}
          onPress={playback.isFinished ? onReplay : onTogglePlayPause}
          className="absolute inset-0 z-5 items-center justify-center">
          <View
            className="items-center justify-center rounded-full"
            style={{
              width: 72,
              height: 72,
              backgroundColor: 'rgba(0,0,0,0.45)',
            }}>
            <Play size={36} color="#FFFFFF" fill="#FFFFFF" />
          </View>
        </Pressable>
      ) : null}

      <View
        className="absolute left-0 right-0 z-10 px-3"
        style={{ bottom: bottomPad, gap: sectionGap }}>
        <View className="gap-1">
          <View className="flex-row items-end gap-2">
            <View className="min-w-0 flex-1" style={{ gap: sectionGap }}>
              <FeedVibeMeta
                vibe={vibe}
                following={following}
                onFollowPress={() => {
                  if (!vibe.artistId) return;
                  if (following) {
                    setFollowing(false);
                    unfollowUser.mutate(vibe.artistId);
                    return;
                  }
                  setFollowing(true);
                  followUser.mutate(vibe.artistId);
                }}
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
              likesLabel={likesLabel}
              commentsLabel={vibe.commentsLabel}
              sharesLabel={vibe.sharesLabel}
              liked={liked}
              onLikePress={() => {
                if (liked) {
                  setLiked(false);
                  setLikeCount((n) => Math.max(0, n - 1));
                  unlikeClip.mutate(vibe.id);
                  return;
                }
                setLiked(true);
                setLikeCount((n) => n + 1);
                likeClip.mutate(vibe.id);
              }}
              onCommentPress={() => setCommentsOpen(true)}
              onSharePress={() => {
                void Share.share({
                  message: `Check out ${vibe.title} by ${vibe.artist} on VibeOGram`,
                });
              }}
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

      <FeedCommentsSheet
        open={commentsOpen}
        trackId={vibe.trackId}
        commentCount={vibe.commentCount}
        onClose={() => setCommentsOpen(false)}
      />
    </View>
  );
}
