import type {
  TrackKind,
  TrackListItem,
  TrackStatus,
  TrackStorageState,
} from '@/features/tracks';

export type LibraryTab = 'audio' | 'projects' | 'albums' | 'playlists';

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

export type LibraryAlbumItem = {
  id: string;
  title: string;
  trackCount: number;
  coverUrl: string;
};

export type LibraryPlaylistVisibility = 'private' | 'public';

export type LibraryPlaylistItem = {
  id: string;
  title: string;
  trackCount: number;
  coverUrl: string;
  visibility: LibraryPlaylistVisibility;
};
