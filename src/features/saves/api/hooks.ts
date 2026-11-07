import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ALBUMS_QUERY_KEY } from '@/features/albums/api/hooks';
import { PLAYLISTS_QUERY_KEY } from '@/features/playlists/api/hooks';

import {
  likeTrack,
  listLikedTracks,
  listSavedAlbums,
  listSavedPlaylists,
  saveAlbum,
  savePlaylist,
  unlikeTrack,
  unsaveAlbum,
  unsavePlaylist,
} from './service';

export const LIKES_QUERY_KEY = ['likes'] as const;
export const LIKED_TRACKS_QUERY_KEY = [...LIKES_QUERY_KEY, 'tracks'] as const;
export const SAVES_QUERY_KEY = ['saves'] as const;
export const SAVED_PLAYLISTS_QUERY_KEY = [...SAVES_QUERY_KEY, 'playlists'] as const;
export const SAVED_ALBUMS_QUERY_KEY = [...SAVES_QUERY_KEY, 'albums'] as const;

export function useLikedTracks() {
  return useQuery({
    queryKey: LIKED_TRACKS_QUERY_KEY,
    queryFn: listLikedTracks,
  });
}

export function useLikeTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (trackId: string) => likeTrack(trackId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: LIKES_QUERY_KEY });
    },
  });
}

export function useUnlikeTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (trackId: string) => unlikeTrack(trackId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: LIKES_QUERY_KEY });
    },
  });
}

export function useSavedPlaylists() {
  return useQuery({
    queryKey: SAVED_PLAYLISTS_QUERY_KEY,
    queryFn: listSavedPlaylists,
  });
}

export function useSavedAlbums() {
  return useQuery({
    queryKey: SAVED_ALBUMS_QUERY_KEY,
    queryFn: listSavedAlbums,
  });
}

function usePlaylistSaveMutation(mutationFn: (playlistId: string) => Promise<unknown>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SAVES_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: PLAYLISTS_QUERY_KEY });
    },
  });
}

function useAlbumSaveMutation(mutationFn: (albumId: string) => Promise<unknown>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SAVES_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ALBUMS_QUERY_KEY });
    },
  });
}

export function useSavePlaylist() {
  return usePlaylistSaveMutation(savePlaylist);
}

export function useUnsavePlaylist() {
  return usePlaylistSaveMutation(unsavePlaylist);
}

export function useSaveAlbum() {
  return useAlbumSaveMutation(saveAlbum);
}

export function useUnsaveAlbum() {
  return useAlbumSaveMutation(unsaveAlbum);
}