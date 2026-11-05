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
