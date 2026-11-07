import type {
  TrackKind,
  TrackListItem,
  TrackStatus,
  TrackStorageState,
} from '@/features/tracks';

export type LibraryTab = 'audio' | 'projects' | 'albums' | 'playlists' | 'saved';

export type LibrarySavedSegment = 'songs' | 'playlists' | 'albums';

export type LibraryLikedTrackItem = {
  id: string;
  title: string;
  artist: string;
  artistAvatarUrl?: string;
  coverUrl: string | null;
  durationSec?: number;
  likeCount: number;
  likedAt: string;
  available: boolean;
};

export type LibraryAudioKind = TrackKind;
export type LibraryAudioStatus = TrackStatus;

export type LibraryAudioFilter =
  | 'all'
  | LibraryAudioKind
  | LibraryAudioStatus;

export type LibraryAudioItem = TrackListItem & {
  localUri: string | null;
  unavailable: boolean;
  storageState: TrackStorageState;
};

export type LibraryAlbumStatus = 'draft' | 'released';

export type LibraryAlbumItem = {
  id: string;
  title: string;
  trackCount: number;
  coverUrl: string | null;
  status: LibraryAlbumStatus;
};

export type LibraryPlaylistVisibility = 'private' | 'public';

export type LibraryPlaylistItem = {
  id: string;
  title: string;
  trackCount: number;
  coverUrl: string | null;
  visibility: LibraryPlaylistVisibility;
};

export type LibrarySavedCollectionItem = {
  id: string;
  kind: 'playlist' | 'album';
  title: string;
  ownerName: string;
  trackCount: number;
  coverUrl: string | null;
  available: boolean;
};

export type LibraryListState = {
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
};