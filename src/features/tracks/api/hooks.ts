import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { backupTrack } from './backup-track';
import { deleteTrackFully } from './delete-track';
import { listTracks } from './service';
import { restoreTrack } from './restore-track';
import { saveTrackDraft, type SaveTrackDraftInput } from './save-track-draft';
import type { TrackStatus } from './types';

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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: TRACKS_QUERY_KEY });
    },
  });
}

export function useDeleteTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTrackFully(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: TRACKS_QUERY_KEY });
    },
  });
}

export function useBackupTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { trackId: string }) => backupTrack(input.trackId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: TRACKS_QUERY_KEY });
    },
  });
}

export function useRestoreTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (trackId: string) => restoreTrack(trackId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: TRACKS_QUERY_KEY });
    },
  });
}
