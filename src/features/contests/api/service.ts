import { apiRequest } from '@/core/api';

import type {
  ContestDetail,
  ContestEntry,
  ContestSummary,
  EligibleTrack,
  LeaderboardRow,
} from './types';

export async function listContests(
  tab: 'upcoming' | 'active' | 'closed',
): Promise<ContestSummary[]> {
  return apiRequest<ContestSummary[]>({
    path: `/api/contests?tab=${tab}`,
    method: 'GET',
  });
}

export async function getContest(id: string): Promise<ContestDetail> {
  return apiRequest<ContestDetail>({
    path: `/api/contests/${id}`,
    method: 'GET',
  });
}

export async function listContestEntries(
  id: string,
  params?: { cursor?: string; limit?: number },
): Promise<{ items: ContestEntry[]; nextCursor: string | null }> {
  const search = new URLSearchParams();
  if (params?.cursor) search.set('cursor', params.cursor);
  if (params?.limit != null) search.set('limit', String(params.limit));
  const query = search.toString();
  return apiRequest({
    path: query
      ? `/api/contests/${id}/entries?${query}`
      : `/api/contests/${id}/entries`,
    method: 'GET',
  });
}

export async function submitContestEntry(
  id: string,
  trackId: string,
): Promise<ContestEntry> {
  return apiRequest<ContestEntry>({
    path: `/api/contests/${id}/entries`,
    method: 'POST',
    body: { trackId },
  });
}

export async function castContestVote(
  id: string,
  entryId: string,
): Promise<{ entryId: string }> {
  return apiRequest({
    path: `/api/contests/${id}/votes`,
    method: 'POST',
    body: { entryId },
  });
}

export async function getContestLeaderboard(
  id: string,
): Promise<LeaderboardRow[]> {
  return apiRequest<LeaderboardRow[]>({
    path: `/api/contests/${id}/leaderboard`,
    method: 'GET',
  });
}

export async function listEligibleTracks(
  id: string,
): Promise<EligibleTrack[]> {
  return apiRequest<EligibleTrack[]>({
    path: `/api/contests/${id}/eligible-tracks`,
    method: 'GET',
  });
}
