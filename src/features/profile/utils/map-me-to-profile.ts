import {
  TRACK_GENRE_LABELS,
  type TrackGenreId,
} from '@/features/tracks/constants/track-genres';

import type { MeDto } from '../api/types';
import type { Profile } from '../types';
import { formatCountLabel } from './format-count-label';

/** Map GET /api/user into the Profile UI model (content tabs empty until catalog APIs). */
export function mapMeToProfile(me: MeDto): Profile {
  const displayName = me.name?.trim() || me.username;
  const zero = formatCountLabel(0);

  return {
    id: me.id,
    name: displayName,
    username: `@${me.username}`,
    verified: false,
    genres: (me.preferredGenres ?? []).map(
      (id) => TRACK_GENRE_LABELS[id as TrackGenreId] ?? id,
    ),
    bio: me.bio ?? '',
    avatarUrl: me.avatarUrl,
    coverUrl: me.coverUrl,
    stats: {
      // MeDto has no counters yet — show 0 rather than an “unknown” dash.
      playsLabel: zero,
      followersLabel: zero,
      followingLabel: zero,
      likesLabel: zero,
    },
    featuredSong: {
      id: `${me.id}-featured`,
      title: 'No featured song yet',
      artistName: displayName,
      durationLabel: '0:00',
      playsLabel: zero,
      coverUrl: me.coverUrl ?? me.avatarUrl ?? '',
      qualityBadge: '',
      formatLabel: '',
    },
    songs: [],
    albums: [],
    playlists: [],
  };
}
