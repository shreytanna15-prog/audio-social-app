import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { backupTrack } from './backup-track';
import {
  deleteCover,
  deleteTrack,
  listPublishedTracksByUser,
  listTracks,
  publishTrack,
  recordPlay,
  unpublishTrack,
  uploadAndCompleteCover,
} from './service';
import { saveTrackDraft, type SaveTrackDraftInput } from './save-track-draft';
import type {
  CoverContentType,
  PublishTrackRequest,
  TrackStatus,
} from './types';

export const TRACKS_QUERY_KEY = ['tracks'] as const;

export function useTracks(status?: TrackStatus) {
  return useQuery({
    queryKey: [...TRACKS_QUERY_KEY, status ?? 'all'],
    queryFn: () => listTracks(status),
  });
}

export function useSaveTrackDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveTrackDraftInput) => saveTrackDraft(input),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: TRACKS_QUERY_KEY });
      if (variables.projectId) {
        await queryClient.invalidateQueries({ queryKey: ['projects'] });
      }
    },
  });
}

export function useDeleteTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTrack(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: TRACKS_QUERY_KEY });
    },
  });
}

export function useBackupTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { trackId: string; layerIds?: string[] }) =>
      backupTrack(input.trackId, input.layerIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: TRACKS_QUERY_KEY });
    },
  });
}

export function useUploadTrackCover() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      trackId: string;
      localUri: string;
      contentType: CoverContentType;
    }) =>
      uploadAndCompleteCover(
        input.trackId,
        input.localUri,
        input.contentType,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: TRACKS_QUERY_KEY });
    },
  });
}

export function useDeleteTrackCover() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (trackId: string) => deleteCover(trackId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: TRACKS_QUERY_KEY });
    },
  });
}

export function usePublishTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { trackId: string; body: PublishTrackRequest }) =>
      publishTrack(input.trackId, input.body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: TRACKS_QUERY_KEY });
    },
  });
}

export function useUnpublishTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (trackId: string) => unpublishTrack(trackId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: TRACKS_QUERY_KEY });
    },
  });
}

export function useRecordPlay() {
  return useMutation({
    mutationFn: (trackId: string) => recordPlay(trackId),
  });
}

export function usePublishedTracksByUser(userId: string | undefined) {
  return useQuery({
    queryKey: ['users', userId, 'tracks', 'published'] as const,
    queryFn: () => listPublishedTracksByUser(userId!),
    enabled: !!userId,
  });
}
