import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  attachAlbumTracks,
  createAlbum,
  deleteAlbum,
  getAlbum,
  listAlbums,
  listPublicAlbumsByUser,
  releaseAlbum,
  unlinkAlbumTrack,
  unreleaseAlbum,
  updateAlbum,
} from './service';
import type {
  AttachAlbumTracksRequest,
  CreateAlbumRequest,
  UpdateAlbumRequest,
} from './types';

export const ALBUMS_QUERY_KEY = ['albums'] as const;

export function useAlbums() {
  return useQuery({
    queryKey: ALBUMS_QUERY_KEY,
    queryFn: listAlbums,
  });
}

export function useAlbum(id: string | undefined) {
  return useQuery({
    queryKey: [...ALBUMS_QUERY_KEY, id],
    queryFn: () => getAlbum(id!),
    enabled: typeof id === 'string' && id.length > 0,
  });
}

export function useCreateAlbum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateAlbumRequest) => createAlbum(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ALBUMS_QUERY_KEY });
    },
  });
}

export function useUpdateAlbum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; body: UpdateAlbumRequest }) =>
      updateAlbum(input.id, input.body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ALBUMS_QUERY_KEY });
    },
  });
}

export function useDeleteAlbum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAlbum(id),
    onSuccess: async (_data, id) => {
      queryClient.removeQueries({ queryKey: [...ALBUMS_QUERY_KEY, id] });
      await queryClient.invalidateQueries({ queryKey: ALBUMS_QUERY_KEY });
    },
  });
}

export function useReleaseAlbum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => releaseAlbum(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ALBUMS_QUERY_KEY });
    },
  });
}

export function useUnreleaseAlbum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => unreleaseAlbum(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ALBUMS_QUERY_KEY });
    },
  });
}

export function useAttachAlbumTracks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; body: AttachAlbumTracksRequest }) =>
      attachAlbumTracks(input.id, input.body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ALBUMS_QUERY_KEY });
    },
  });
}

export function useUnlinkAlbumTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { albumId: string; trackId: string }) =>
      unlinkAlbumTrack(input.albumId, input.trackId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ALBUMS_QUERY_KEY });
    },
  });
}

export function usePublicAlbumsByUser(userId: string | undefined) {
  return useQuery({
    queryKey: [...ALBUMS_QUERY_KEY, 'public', userId] as const,
    queryFn: () => listPublicAlbumsByUser(userId!),
    enabled: typeof userId === 'string' && userId.length > 0,
  });
}
