import { apiRequest } from '@/core/api';

import type { AuthSessionData, LoginRequest, RefreshData, SignupRequest } from './types';

export async function login(body: LoginRequest): Promise<AuthSessionData> {
  return apiRequest<AuthSessionData>({
    path: '/api/auth/login',
    method: 'POST',
    body,
    auth: 'none',
  });
}

export async function signup(body: SignupRequest): Promise<AuthSessionData> {
  return apiRequest<AuthSessionData>({
    path: '/api/auth/signup',
    method: 'POST',
    body,
    auth: 'none',
  });
}

/** Manual refresh helper. The API client also refreshes automatically on 401. */
export async function refresh(): Promise<RefreshData> {
  return apiRequest<RefreshData>({
    path: '/api/auth/refresh',
    method: 'POST',
    auth: 'refresh',
    skipAuthRefresh: true,
  });
}
