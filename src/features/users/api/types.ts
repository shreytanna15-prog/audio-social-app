export type UserSearchResult = {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
};

export type PublicUserProfile = {
  id: string;
  username: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isFollowedBy: boolean;
  isMutual: boolean;
  isSelf: boolean;
};

export type FollowActionResult = {
  id: string;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isFollowedBy: boolean;
  isMutual: boolean;
};

export type FollowListUser = {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  isFollowing: boolean;
};

export type FollowListPage = {
  items: FollowListUser[];
  nextCursor: string | null;
};

export type SearchTrackItem = {
  id: string;
  title: string;
  coverUrl: string | null;
  mixUrl: string | null;
  playCount: number;
  durationMs: number;
  artist: {
    id: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  };
};

export type SearchPlaylistItem = {
  id: string;
  title: string;
  coverUrl: string | null;
  trackCount: number;
  owner: {
    id: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  };
};

export type SearchAlbumItem = {
  id: string;
  title: string;
  coverUrl: string | null;
  trackCount: number;
  releasedAt: string | null;
  artist: {
    id: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  };
};

export type MusicSearchFirstTrack = {
  id: string;
  title: string;
  mixUrl: string | null;
  coverUrl: string | null;
  artistName: string;
};

type MusicSearchBase = {
  id: string;
  title: string;
  subtitle: string;
  coverUrl: string | null;
};

export type MusicSearchItem =
  | (MusicSearchBase & {
      type: 'song';
      mixUrl: string | null;
      playCount: number;
      artist: { id: string; username: string; name: string | null };
    })
  | (MusicSearchBase & {
      type: 'playlist';
      trackCount: number;
      saveCount: number;
      firstTrack: MusicSearchFirstTrack | null;
    })
  | (MusicSearchBase & {
      type: 'album';
      trackCount: number;
      firstTrack: MusicSearchFirstTrack | null;
    });

export type SearchRecentKind = 'ARTIST' | 'SONG' | 'ALBUM' | 'PLAYLIST';

export type SearchRecentItem = {
  id: string;
  kind: SearchRecentKind;
  targetKey: string;
  query: string | null;
  title: string | null;
  subtitle: string | null;
  coverUrl: string | null;
  targetUser: UserSearchResult | null;
  updatedAt: string;
};

export type RecordArtistSearchRecentRequest = {
  kind: 'ARTIST';
  targetUserId: string;
  query?: string;
};

export type RecordMediaSearchRecentRequest = {
  kind: 'SONG' | 'ALBUM' | 'PLAYLIST';
  targetId: string;
  title: string;
  subtitle?: string;
  coverUrl?: string;
  query?: string;
};

export type RecordSearchRecentRequest =
  | RecordArtistSearchRecentRequest
  | RecordMediaSearchRecentRequest;
