import type { MeDto } from '../api/types';
import type { Profile } from '../types';

/** Map GET /api/user into the Profile UI model (content tabs empty until catalog APIs). */
export function mapMeToProfile(me: MeDto): Profile {
  const displayName = me.name?.trim() || me.username;

  return {
    id: me.id,
    name: displayName,
    username: `@${me.username}`,
    verified: false,
    genres: [],
    bio: me.bio ?? '',
    avatarUrl: me.avatarUrl,
    coverUrl: me.coverUrl,
    stats: {
      playsLabel: '—',
      followersLabel: '—',
      likesLabel: '—',
    },
    featuredSong: {
      id: `${me.id}-featured`,
      title: 'No featured song yet',
      artistName: displayName,
      durationLabel: '—',
      playsLabel: '—',
      coverUrl: me.coverUrl ?? me.avatarUrl ?? '',
      qualityBadge: '',
      formatLabel: '',
    },
    songs: [],
    albums: [],
    playlists: [],
  };
}
