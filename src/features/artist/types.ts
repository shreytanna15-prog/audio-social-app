export type ArtistContentTab = 'songs' | 'albums' | 'playlists';

export type ArtistTrack = {
  id: string;
  title: string;
  coverUrl: string;
  durationLabel: string;
  playsLabel: string;
  durationSec?: number;
};

export type ArtistAlbum = {
  id: string;
  title: string;
  yearLabel: string;
  trackCount: number;
  coverUrl: string;
};

export type ArtistPlaylist = {
  id: string;
  title: string;
  trackCount: number;
  coverUrl: string;
};

export type ArtistFeaturedSong = {
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

export type ArtistProfile = {
  id: string;
  name: string;
  username: string;
  verified: boolean;
  isOnline?: boolean;
  genres: string[];
  bio: string;
  avatarUrl: string;
  coverUrl: string;
  stats: {
    playsLabel: string;
    followersLabel: string;
    likesLabel: string;
  };
  featuredSong: ArtistFeaturedSong;
  songs: ArtistTrack[];
  albums: ArtistAlbum[];
  playlists: ArtistPlaylist[];
};
