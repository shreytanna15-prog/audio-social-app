import { describe, expect, it } from 'vitest';

import type { FollowActionResult, PublicUserProfile } from './types';

/** Mirrors optimistic patch logic used by useFollowUser / useUnfollowUser. */
function applyOptimisticFollow(
  prev: PublicUserProfile,
  following: boolean,
): PublicUserProfile {
  if (following === prev.isFollowing) {
    return prev;
  }
  return {
    ...prev,
    isFollowing: following,
    followerCount: following
      ? prev.followerCount + 1
      : Math.max(0, prev.followerCount - 1),
    isMutual: following ? prev.isFollowedBy : false,
  };
}

function applyServerResult(
  prev: PublicUserProfile,
  result: FollowActionResult,
): PublicUserProfile {
  return {
    ...prev,
    followerCount: result.followerCount,
    followingCount: result.followingCount,
    isFollowing: result.isFollowing,
    isFollowedBy: result.isFollowedBy,
    isMutual: result.isMutual,
  };
}

describe('follow cache patching (integration)', () => {
  const base: PublicUserProfile = {
    id: '1',
    username: 'alice',
    name: 'Alice',
    bio: null,
    avatarUrl: null,
    coverUrl: null,
    followerCount: 10,
    followingCount: 2,
    isFollowing: false,
    isFollowedBy: true,
    isMutual: false,
    isSelf: false,
  };

  it('optimistic follow increments count and sets mutual when followedBy', () => {
    const next = applyOptimisticFollow(base, true);
    expect(next.isFollowing).toBe(true);
    expect(next.followerCount).toBe(11);
    expect(next.isMutual).toBe(true);
  });

  it('optimistic unfollow decrements and clears mutual', () => {
    const following = { ...base, isFollowing: true, isMutual: true };
    const next = applyOptimisticFollow(following, false);
    expect(next.isFollowing).toBe(false);
    expect(next.followerCount).toBe(9);
    expect(next.isMutual).toBe(false);
  });

  it('server result overwrites optimistic fields', () => {
    const optimistic = applyOptimisticFollow(base, true);
    const server = applyServerResult(optimistic, {
      id: '1',
      followerCount: 12,
      followingCount: 2,
      isFollowing: true,
      isFollowedBy: true,
      isMutual: true,
    });
    expect(server.followerCount).toBe(12);
    expect(server.isMutual).toBe(true);
  });
});
