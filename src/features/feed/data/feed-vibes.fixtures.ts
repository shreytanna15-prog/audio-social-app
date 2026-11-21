import {
  buildPeaksForAudioSource,
  FEED_PREVIEW_DEMO,
} from './feed-preview-audio';
import type { FeedVibe } from '../types';

const demoPeaks = buildPeaksForAudioSource(FEED_PREVIEW_DEMO);

/**
 * Development fixtures — swap for feed API when available.
 *
 * Preview audio: all vibes currently share `assets/demo.mp3` until distinct
 * clips are added under `assets/feed/` (see FEED_PREVIEW_ASSET_PATHS).
 */
export const FEED_VIBES: FeedVibe[] = [
  {
    id: 'feed-1',
    title: 'Luminous Drift',
    subtitle: '(Vocal Stem Flip)',
    artist: 'Aura Mist',
    artistId: 'aura-mist',
    artistAvatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994d69daeb?w=200&h=200&fit=crop&crop=faces',
    coverUrl:
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&h=1800&fit=crop',
    genresLabel: 'Electronic / Neo-Soul',
    bpm: 124,
    verified: true,
    likesLabel: '14.8k',
    commentsLabel: '382',
    sharesLabel: '1.2k',
    durationSec: 228,
    previewDurationSec: 45,
    previewAudio: FEED_PREVIEW_DEMO,
    waveformPeaks: demoPeaks,
    isLiked: false,
    isFollowing: false,
    likeCount: 14800,
    commentCount: 382,
  },
  {
    id: 'feed-2',
    title: 'Astral Echoes',
    subtitle: undefined,
    artist: 'Elara',
    artistId: 'elara',
    artistAvatarUrl:
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&h=200&fit=crop&crop=faces',
    coverUrl:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=1800&fit=crop',
    genresLabel: 'Deep Space Ambient',
    bpm: 95,
    verified: false,
    likesLabel: '9.2k',
    commentsLabel: '214',
    sharesLabel: '640',
    durationSec: 252,
    previewDurationSec: 40,
    previewAudio: FEED_PREVIEW_DEMO,
    waveformPeaks: demoPeaks,
    isLiked: false,
    isFollowing: false,
    likeCount: 9200,
    commentCount: 214,
  },
  {
    id: 'feed-3',
    title: 'Midnight Pulse',
    subtitle: '(Stem Mix)',
    artist: 'Nova Blake',
    artistId: 'nova-blake',
    artistAvatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
    coverUrl:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&h=1800&fit=crop',
    genresLabel: 'Synthwave / Leftfield',
    bpm: 118,
    verified: true,
    likesLabel: '6.4k',
    commentsLabel: '156',
    sharesLabel: '410',
    durationSec: 195,
    previewDurationSec: 35,
    previewAudio: FEED_PREVIEW_DEMO,
    waveformPeaks: demoPeaks,
    isLiked: false,
    isFollowing: false,
    likeCount: 6400,
    commentCount: 156,
  },
  {
    id: 'feed-4',
    title: 'Velvet Rain',
    subtitle: 'Acoustic Take',
    artist: 'Luna Reed',
    artistId: 'luna-reed',
    artistAvatarUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces',
    coverUrl:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=1800&fit=crop',
    genresLabel: 'Alt-R&B / Acoustic',
    bpm: 88,
    verified: true,
    likesLabel: '4.1k',
    commentsLabel: '98',
    sharesLabel: '220',
    durationSec: 174,
    previewDurationSec: 30,
    previewAudio: FEED_PREVIEW_DEMO,
    waveformPeaks: demoPeaks,
    isLiked: false,
    isFollowing: false,
    likeCount: 4100,
    commentCount: 98,
  },
];
