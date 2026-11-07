export type AlbumStatusDto = 'DRAFT' | 'RELEASED';

export type AlbumSummaryDto = {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  status: AlbumStatusDto;
  releasedAt: string | null;
  trackCount: number;
  coverUrl: string | null;
  coverFallbackUrl: string | null;
  updatedAt: string;
  createdAt: string;
};

export type AlbumTrackItemDto = {
  id: string;
  position: number;
  addedAt: string;
  available: boolean;
  title: string;
  kind?: string;
  durationMs?: number;
  mixUrl?: string | null;
  coverUrl?: string | null;
  artist?: {
    id: string;
    username: string;
    name: string | null;
  };
};

export type AlbumDetailDto = AlbumSummaryDto & {
  isOwner: boolean;
  isSaved: boolean;
  tracks: AlbumTrackItemDto[];
};

export type CreateAlbumRequest = {
  title: string;
  description?: string | null;
};

export type AttachAlbumTracksRequest = {
  trackIds: string[];
};

export type AttachAlbumTracksResponse = {
  attached: string[];
};

export type UpdateAlbumRequest = {
  title?: string;
  description?: string | null;
};

export type DeleteAlbumResponse = {
  id: string;
};

export type UnlinkAlbumTrackResponse = {
  id: string;
  trackId: string;
};
