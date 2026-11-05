import { describe, expect, it } from 'vitest';

import type { PublicUserProfile } from '@/features/users';

import { formatCountLabel, mapPublicProfileToProfile } from './map-public-profile';

describe('formatCountLabel (unit)', () => {
  it('formats small, thousands, and millions', () => {
    expect(formatCountLabel(0)).toBe('0');
    expect(formatCountLabel(999)).toBe('999');
    expect(formatCountLabel(1000)).toBe('1K');
    expect(formatCountLabel(3200)).toBe('3.2K');
    expect(formatCountLabel(1_000_000)).toBe('1M');
    expect(formatCountLabel(2_500_000)).toBe('2.5M');
  });
});

describe('mapPublicProfileToProfile (unit)', () => {
  const api: PublicUserProfile = {
    id: '0198e2c0-5c8a-7b3e-9f1d-2a4b6c8d0e1f',
    username: 'alice',
    name: 'Alice Night',
    bio: 'Hello world',
    avatarUrl: 'https://cdn.example.com/a.jpg',
    coverUrl: 'https://cdn.example.com/c.jpg',
    followerCount: 3200,
    followingCount: 12,
    isFollowing: true,
    isFollowedBy: false,
    isMutual: false,
    isSelf: false,
  };

  it('maps display fields and follower label', () => {
    const profile = mapPublicProfileToProfile(api);
    expect(profile.id).toBe(api.id);
    expect(profile.name).toBe('Alice Night');
    expect(profile.username).toBe('@alice');
    expect(profile.bio).toBe('Hello world');
    expect(profile.avatarUrl).toBe(api.avatarUrl);
    expect(profile.coverUrl).toBe(api.coverUrl);
    expect(profile.stats.followersLabel).toBe('3.2K');
    expect(profile.songs).toEqual([]);
  });

  it('falls back to username when name is null', () => {
    const profile = mapPublicProfileToProfile({ ...api, name: null });
    expect(profile.name).toBe('alice');
  });

  it('keeps null media URLs for initials / empty cover', () => {
    const profile = mapPublicProfileToProfile({
      ...api,
      avatarUrl: null,
      coverUrl: null,
      bio: null,
    });
    expect(profile.avatarUrl).toBeNull();
    expect(profile.coverUrl).toBeNull();
    expect(profile.bio).toBe('');
  });
});
