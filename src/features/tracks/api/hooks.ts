import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { backupTrack } from './backup-track';
import { deleteTrack, listTracks } from './service';
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
