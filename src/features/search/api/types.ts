import type { UserSearchResult } from '@/features/users/api/types';

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
