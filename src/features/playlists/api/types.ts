export type PlaylistVisibilityDto = 'PRIVATE' | 'PUBLIC';

export type PlaylistSummaryDto = {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  visibility: PlaylistVisibilityDto;
  trackCount: number;
  saveCount: number;
  coverUrl: string | null;
  coverFallbackUrls: string[];
  updatedAt: string;
  createdAt: string;
};

export type CollectionTrackArtistDto = {
  id: string;
  username: string;
  name: string | null;
};

export type CollectionTrackItemDto = {
  id: string;
  position: number;
  addedAt: string;
  available: boolean;
  title: string;
  kind?: string;
  durationMs?: number;
  mixUrl?: string | null;
  coverUrl?: string | null;
  artist?: CollectionTrackArtistDto;
};

export type PlaylistDetailDto = PlaylistSummaryDto & {
  isOwner: boolean;
  isSaved: boolean;
  tracks: CollectionTrackItemDto[];
};

export type CreatePlaylistRequest = {
  title: string;
  description?: string | null;
  visibility?: PlaylistVisibilityDto;
};

export type AttachPlaylistTracksRequest = {
  trackIds: string[];
};

export type AttachPlaylistTracksResponse = {
  attached: string[];
};

export type UpdatePlaylistRequest = {
  title?: string;
  description?: string | null;
  visibility?: PlaylistVisibilityDto;
};

export type DeletePlaylistResponse = {
  id: string;
};

export type UnlinkPlaylistTrackResponse = {
  id: string;
  trackId: string;
};
