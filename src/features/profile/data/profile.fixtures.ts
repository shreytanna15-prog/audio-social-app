/**
 * Development fixtures for profiles.
 * Isolated from API clients — replace with /me and public profile endpoints later.
 */
import { FEATURED_ARTISTS } from '@/shared/data/featured-artists';

import type { Profile } from '../types';

const TRACK_COVERS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&h=200&fit=crop',
];

/** Primary Figma reference fixture — Aura Mist (also used as “me” until /me exists) */
export const AURA_MIST_PROFILE: Profile = {
  id: 'aura-mist',
  name: 'Aura Mist',
  username: '@auramist',
  verified: true,
  isOnline: true,
  genres: ['Electronic', 'Neo-Soul', 'Sound Designer'],
  bio: 'Independent electronic vocalist & producer exploring neo-soul melodies, modular synth soundscapes, and hypnotic vocal textures. Available for stem collabs, remix swaps, and late-night session bookings worldwide.',
  avatarUrl:
    'https://images.unsplash.com/photo-1534528741775-53994d69daeb?w=400&h=400&fit=crop&crop=faces',
  coverUrl:
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&h=600&fit=crop',
  stats: {
    playsLabel: '24.5K',
    followersLabel: '3.2K',
    likesLabel: '8.7K',
  },
  featuredSong: {
    id: 'aura-featured',
    title: 'Luminous Drift (Vocal Stem Flip)',
    artistName: 'Aura Mist',
    durationLabel: '3:48',
    playsLabel: '14.8k plays',
    coverUrl:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop',
    qualityBadge: 'Master Audio',
    formatLabel: '48kHz • 24bit',
    durationSec: 228,
  },
  songs: [
    {
      id: 'aura-1',
      title: 'Luminous Drift',
      coverUrl: TRACK_COVERS[0]!,
      durationLabel: '3:48',
      playsLabel: '14.8k plays',
      durationSec: 228,
    },
    {
      id: 'aura-2',
      title: 'Astral Echoes',
      coverUrl: TRACK_COVERS[1]!,
      durationLabel: '4:12',
      playsLabel: '9.2k plays',
      durationSec: 252,
    },
    {
      id: 'aura-3',
      title: 'Midnight Pulse (Stem Mix)',
      coverUrl: TRACK_COVERS[2]!,
      durationLabel: '3:15',
      playsLabel: '6.4k plays',
      durationSec: 195,
    },
    {
      id: 'aura-4',
      title: 'Velvet Rain - Acoustic Take',
      coverUrl: TRACK_COVERS[3]!,
      durationLabel: '2:54',
      playsLabel: '4.1k plays',
      durationSec: 174,
    },
  ],
  albums: [
    {
      id: 'aura-a1',
      title: 'Luminous Drift',
      yearLabel: '2025',
      trackCount: 8,
      coverUrl: TRACK_COVERS[0]!,
    },
    {
      id: 'aura-a2',
      title: 'Booth Nights',
      yearLabel: '2024',
      trackCount: 10,
      coverUrl: TRACK_COVERS[2]!,
    },
    {
      id: 'aura-a3',
      title: 'Signal Bloom',
      yearLabel: '2024',
      trackCount: 7,
      coverUrl: TRACK_COVERS[1]!,
    },
    {
      id: 'aura-a4',
      title: 'Quiet Hours',
      yearLabel: '2023',
      trackCount: 12,
      coverUrl: TRACK_COVERS[3]!,
    },
  ],
  playlists: [
    {
      id: 'aura-p1',
      title: 'Vocal Warmups',
      trackCount: 18,
      coverUrl: TRACK_COVERS[3]!,
    },
    {
      id: 'aura-p2',
      title: 'Night Drive Stems',
      trackCount: 24,
      coverUrl: TRACK_COVERS[0]!,
    },
    {
      id: 'aura-p3',
      title: 'Collab Board',
      trackCount: 14,
      coverUrl: TRACK_COVERS[1]!,
    },
  ],
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 18);
}

function buildProfileFromFeatured(
  artist: (typeof FEATURED_ARTISTS)[number],
): Profile {
  const songs = [
    {
      id: `${artist.id}-song-1`,
      title: 'Midnight Signal',
      coverUrl: TRACK_COVERS[0]!,
      durationLabel: '3:42',
      playsLabel: '12.1k plays',
      durationSec: 222,
    },
    {
      id: `${artist.id}-song-2`,
      title: 'Glass Cathedral',
      coverUrl: TRACK_COVERS[1]!,
      durationLabel: '4:08',
      playsLabel: '8.4k plays',
      durationSec: 248,
    },
    {
      id: `${artist.id}-song-3`,
      title: 'Velvet Frequency',
      coverUrl: TRACK_COVERS[2]!,
      durationLabel: '2:56',
      playsLabel: '6.2k plays',
      durationSec: 176,
    },
    {
      id: `${artist.id}-song-4`,
      title: 'Afterglow Loop',
      coverUrl: TRACK_COVERS[3]!,
      durationLabel: '3:21',
      playsLabel: '4.9k plays',
      durationSec: 201,
    },
  ];

  return {
    id: artist.id,
    name: artist.name,
    username: `@${slugify(artist.name)}`,
    verified: artist.verified ?? true,
    isOnline: false,
    genres: [artist.genre, 'Creator'],
    bio: `${artist.name} crafts atmospheric ${artist.genre.toLowerCase()} with late-night booth textures and intimate vocal layers.`,
    avatarUrl: artist.avatarUrl,
    coverUrl:
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&h=600&fit=crop',
    stats: {
      playsLabel: '18.2K',
      followersLabel: '2.1K',
      likesLabel: '5.4K',
    },
    featuredSong: {
      id: `${artist.id}-featured`,
      title: songs[0]!.title,
      artistName: artist.name,
      durationLabel: songs[0]!.durationLabel,
      playsLabel: songs[0]!.playsLabel,
      coverUrl: songs[0]!.coverUrl,
      qualityBadge: 'Master Audio',
      formatLabel: '48kHz • 24bit',
      durationSec: songs[0]!.durationSec,
    },
    songs,
    albums: [
      {
        id: `${artist.id}-album-1`,
        title: 'Booth Diaries',
        yearLabel: '2025',
        trackCount: 10,
        coverUrl: TRACK_COVERS[0]!,
      },
      {
        id: `${artist.id}-album-2`,
        title: 'Signal Bloom',
        yearLabel: '2024',
        trackCount: 8,
        coverUrl: TRACK_COVERS[2]!,
      },
    ],
    playlists: [
      {
        id: `${artist.id}-pl-1`,
        title: 'Studio Sessions',
        trackCount: 16,
        coverUrl: TRACK_COVERS[1]!,
      },
      {
        id: `${artist.id}-pl-2`,
        title: 'Warmup Pack',
        trackCount: 12,
        coverUrl: TRACK_COVERS[3]!,
      },
    ],
  };
}

export const PROFILE_FIXTURES: Profile[] = [
  AURA_MIST_PROFILE,
  ...FEATURED_ARTISTS.map(buildProfileFromFeatured),
];

const PROFILE_BY_ID = new Map(
  PROFILE_FIXTURES.map((profile) => [profile.id, profile]),
);

export function getProfileFixture(id: string | undefined): Profile {
  if (id && PROFILE_BY_ID.has(id)) {
    return PROFILE_BY_ID.get(id)!;
  }
  return AURA_MIST_PROFILE;
}

/** Logged-in user fixture until auth’d /me exists. */
export function getMyProfileFixture(): Profile {
  return AURA_MIST_PROFILE;
}
