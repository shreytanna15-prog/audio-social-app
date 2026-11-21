export type ProfileContentTab = 'songs' | 'albums' | 'playlists';

export type ProfileTrack = {
  id: string;
  title: string;
  coverUrl: string;
  durationLabel: string;
  playsLabel: string;
  durationSec?: number;
};

export type ProfileAlbum = {
  id: string;
  title: string;
  yearLabel: string;
  trackCount: number;
  coverUrl: string;
};

export type ProfilePlaylist = {
  id: string;
  title: string;
  trackCount: number;
  coverUrl: string;
};

export type ProfileFeaturedSong = {
  id: string;
  title: string;
  artistName: string;
  durationLabel: string;
  playsLabel: string;
  coverUrl: string;
  qualityBadge: string;
  formatLabel: string;
  durationSec?: number;
};

export type Profile = {
  id: string;
  name: string;
  username: string;
  verified: boolean;
  isOnline?: boolean;
  genres: string[];
  bio: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  stats: {
    playsLabel: string;
    followersLabel: string;
    followingLabel: string;
    likesLabel: string;
  };
  featuredSong: ProfileFeaturedSong;
  songs: ProfileTrack[];
  albums: ProfileAlbum[];
  playlists: ProfilePlaylist[];
};
