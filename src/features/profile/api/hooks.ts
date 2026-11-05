import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/auth.store';
import {
  SEARCH_RECENT_QUERY_KEY,
  USER_PROFILE_QUERY_KEY,
  USERS_SEARCH_QUERY_KEY,
} from '@/features/users';

import {
  checkUsernameAvailability,
  completeAvatarUpload,
  completeCoverUpload,
  createAvatarUploadUrl,
  createCoverUploadUrl,
  deleteAvatar,
  deleteCover,
  getMe,
  patchMe,
  uploadProfileImage,
} from './service';
import type {
  MeDto,
  PatchProfileBody,
  ProfileImageContentType,
  ProfileMediaCompleteBody,
} from './types';

export const ME_QUERY_KEY = ['user', 'me'] as const;

/** Keep me fresh and drop stale public/search/chat participant snapshots. */
function syncMeCaches(queryClient: QueryClient, data: MeDto) {
  queryClient.setQueryData(ME_QUERY_KEY, data);
  void queryClient.invalidateQueries({ queryKey: USER_PROFILE_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: USERS_SEARCH_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: SEARCH_RECENT_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: ['conversations'] });
}

export function useMe() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: getMe,
    enabled: isAuthenticated,
  });
}

export function usePatchMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: PatchProfileBody) => patchMe(body),
    onSuccess: (data) => {
      syncMeCaches(queryClient, data);
    },
  });
}

export function useUsernameAvailability(username: string, enabled: boolean) {
  return useQuery({
    queryKey: ['user', 'username-availability', username] as const,
    queryFn: () => checkUsernameAvailability(username),
    enabled: enabled && username.length >= 3,
    staleTime: 10_000,
  });
}

async function uploadAndComplete(params: {
  kind: 'avatar' | 'cover';
  localUri: string;
  contentType: ProfileImageContentType;
}) {
  const upload =
    params.kind === 'avatar'
      ? await createAvatarUploadUrl(params.contentType)
      : await createCoverUploadUrl(params.contentType);

  await uploadProfileImage(upload.signedUrl, params.localUri, params.contentType);

  const body: ProfileMediaCompleteBody = {
    path: upload.path,
    contentType: params.contentType,
  };

  return params.kind === 'avatar'
    ? completeAvatarUpload(body)
    : completeCoverUpload(body);
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      localUri: string;
      contentType: ProfileImageContentType;
    }) =>
      uploadAndComplete({
        kind: 'avatar',
        localUri: input.localUri,
        contentType: input.contentType,
      }),
    onSuccess: (data) => {
      syncMeCaches(queryClient, data);
    },
  });
}

export function useUploadCover() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      localUri: string;
      contentType: ProfileImageContentType;
    }) =>
      uploadAndComplete({
        kind: 'cover',
        localUri: input.localUri,
        contentType: input.contentType,
      }),
    onSuccess: (data) => {
      syncMeCaches(queryClient, data);
    },
  });
}

export function useDeleteAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAvatar,
    onSuccess: (data) => {
      syncMeCaches(queryClient, data);
    },
  });
}

export function useDeleteCover() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCover,
    onSuccess: (data) => {
      syncMeCaches(queryClient, data);
    },
  });
}
