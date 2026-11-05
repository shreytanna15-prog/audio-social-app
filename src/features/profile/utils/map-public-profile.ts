import type { PublicUserProfile } from '@/features/users';

import type { Profile } from '../types';
import { formatCountLabel } from './format-count-label';

export { formatCountLabel } from './format-count-label';

/** Map API public profile into the existing Profile UI model. */
export function mapPublicProfileToProfile(api: PublicUserProfile): Profile {
  const displayName = api.name?.trim() || api.username;

  return {
    id: api.id,
    name: displayName,
    username: `@${api.username}`,
    verified: false,
    genres: [],
    bio: api.bio ?? '',
    avatarUrl: api.avatarUrl,
    coverUrl: api.coverUrl,
    stats: {
      playsLabel: '—',
      followersLabel: formatCountLabel(api.followerCount),
      likesLabel: '—',
    },
    featuredSong: {
      id: `${api.id}-featured`,
      title: 'No featured song yet',
      artistName: displayName,
      durationLabel: '—',
      playsLabel: '—',
      coverUrl: api.coverUrl ?? api.avatarUrl ?? '',
      qualityBadge: '',
      formatLabel: '',
    },
    songs: [],
    albums: [],
    playlists: [],
  };
}
