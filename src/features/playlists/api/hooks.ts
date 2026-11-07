import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  attachPlaylistTracks,
  createPlaylist,
  deletePlaylist,
  getPlaylist,
  listPlaylists,
  listPublicPlaylistsByUser,
  unlinkPlaylistTrack,
  updatePlaylist,
} from './service';
import type {
  AttachPlaylistTracksRequest,
  CreatePlaylistRequest,
  UpdatePlaylistRequest,
} from './types';

export const PLAYLISTS_QUERY_KEY = ['playlists'] as const;

export function usePlaylists() {
  return useQuery({
    queryKey: PLAYLISTS_QUERY_KEY,
    queryFn: listPlaylists,
  });
}

export function usePlaylist(id: string | undefined) {
  return useQuery({
    queryKey: [...PLAYLISTS_QUERY_KEY, id],
    queryFn: () => getPlaylist(id!),
    enabled: typeof id === 'string' && id.length > 0,
  });
}

export function useCreatePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreatePlaylistRequest) => createPlaylist(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PLAYLISTS_QUERY_KEY });
    },
  });
}

export function useUpdatePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; body: UpdatePlaylistRequest }) =>
      updatePlaylist(input.id, input.body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PLAYLISTS_QUERY_KEY });
    },
  });
}

export function useDeletePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePlaylist(id),
    onSuccess: async (_data, id) => {
      queryClient.removeQueries({ queryKey: [...PLAYLISTS_QUERY_KEY, id] });
      await queryClient.invalidateQueries({ queryKey: PLAYLISTS_QUERY_KEY });
    },
  });
}

export function useAttachPlaylistTracks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; body: AttachPlaylistTracksRequest }) =>
      attachPlaylistTracks(input.id, input.body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PLAYLISTS_QUERY_KEY });
    },
  });
}

export function useUnlinkPlaylistTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { playlistId: string; trackId: string }) =>
      unlinkPlaylistTrack(input.playlistId, input.trackId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PLAYLISTS_QUERY_KEY });
    },
  });
}

export function usePublicPlaylistsByUser(userId: string | undefined) {
  return useQuery({
    queryKey: [...PLAYLISTS_QUERY_KEY, 'public', userId] as const,
    queryFn: () => listPublicPlaylistsByUser(userId!),
    enabled: typeof userId === 'string' && userId.length > 0,
  });
}
