import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/core/api', () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from '@/core/api';
import {
  clearSearchRecent,
  followUser,
  getPublicProfile,
  listSearchRecent,
  recordSearchRecent,
  searchUsers,
  unfollowUser,
} from './service';

const mockedRequest = vi.mocked(apiRequest);

describe('users api service (unit)', () => {
  beforeEach(() => {
    mockedRequest.mockReset();
  });

  it('searchUsers builds query string', async () => {
    mockedRequest.mockResolvedValueOnce([]);
    await searchUsers('Alice', 10);
    expect(mockedRequest).toHaveBeenCalledWith({
      path: '/api/users/search?q=Alice&limit=10',
      method: 'GET',
    });
  });

  it('getPublicProfile / follow / unfollow hit correct paths', async () => {
    mockedRequest.mockResolvedValue({} as never);
    const id = '0198e2c0-5c8a-7b3e-9f1d-2a4b6c8d0e1f';

    await getPublicProfile(id);
    await followUser(id);
    await unfollowUser(id);

    expect(mockedRequest.mock.calls.map((c) => c[0])).toEqual([
      { path: `/api/users/${id}`, method: 'GET' },
      { path: `/api/users/${id}/follow`, method: 'POST' },
      { path: `/api/users/${id}/follow`, method: 'DELETE' },
    ]);
  });

  it('recent search list/record/clear', async () => {
    mockedRequest.mockResolvedValue([] as never);

    await listSearchRecent();
    await recordSearchRecent({
      kind: 'ARTIST',
      targetUserId: '0198e2c0-5c8a-7b3e-9f1d-2a4b6c8d0e1f',
      query: 'ali',
    });
    await clearSearchRecent();

    expect(mockedRequest.mock.calls.map((c) => c[0])).toEqual([
      { path: '/api/search/recent', method: 'GET' },
      {
        path: '/api/search/recent',
        method: 'POST',
        body: {
          kind: 'ARTIST',
          targetUserId: '0198e2c0-5c8a-7b3e-9f1d-2a4b6c8d0e1f',
          query: 'ali',
        },
      },
      { path: '/api/search/recent', method: 'DELETE' },
    ]);
  });
});
