export type LikeActionResponse = {
  id: string;
  isLiked: boolean;
  likeCount: number;
};

export type LikedTrackArtistDto = {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
};

export type LikedTrackSummaryDto = {
  id: string;
  title: string;
  kind?: 'SINGLE' | 'MULTI';
  durationMs?: number;
  coverUrl?: string | null;
  mixUrl?: string | null;
  likeCount?: number;
  isLiked?: true;
  artist?: LikedTrackArtistDto;
};

export type LikedTrackItemDto = {
  likedAt: string;
  available: boolean;
  track: LikedTrackSummaryDto | null;
};

export type SaveOwnerDto = {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
};

export type PlaylistSaveResponse = {
  id: string;
  isSaved: boolean;
  saveCount: number;
};

export type AlbumSaveResponse = {
  id: string;
  isSaved: boolean;
};

export type SavedPlaylistSummaryDto = {
  id: string;
  title: string;
  ownerId?: string;
  description?: string | null;
  visibility?: 'PRIVATE' | 'PUBLIC';
  trackCount?: number;
  saveCount?: number;
  coverUrl?: string | null;
  coverFallbackUrls?: string[];
  owner?: SaveOwnerDto;
};

export type SavedPlaylistItemDto = {
  savedAt: string;
  available: boolean;
  playlist: SavedPlaylistSummaryDto;
};

export type SavedAlbumSummaryDto = {
  id: string;
  title: string;
  ownerId?: string;
  description?: string | null;
  status?: 'DRAFT' | 'RELEASED';
  trackCount?: number;
  coverUrl?: string | null;
  coverFallbackUrl?: string | null;
  owner?: SaveOwnerDto;
};

export type SavedAlbumItemDto = {
  savedAt: string;
  available: boolean;
  album: SavedAlbumSummaryDto;
};
