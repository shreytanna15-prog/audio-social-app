import { apiRequest } from '@/core/api';

import type {
  AuthSessionData,
  ConfirmPasswordResetRequest,
  ConfirmPasswordResetResult,
  LoginRequest,
  RefreshData,
  RequestPasswordResetRequest,
  RequestPasswordResetResult,
  SignupRequest,
  VerifyPasswordResetOtpRequest,
  VerifyPasswordResetOtpResult,
} from './types';

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

export async function requestPasswordReset(
  body: RequestPasswordResetRequest,
): Promise<RequestPasswordResetResult> {
  return apiRequest<RequestPasswordResetResult>({
    path: '/api/auth/password-reset/request',
    method: 'POST',
    body,
    auth: 'none',
  });
}

export async function verifyPasswordResetOtp(
  body: VerifyPasswordResetOtpRequest,
): Promise<VerifyPasswordResetOtpResult> {
  return apiRequest<VerifyPasswordResetOtpResult>({
    path: '/api/auth/password-reset/verify',
    method: 'POST',
    body,
    auth: 'none',
  });
}

export async function confirmPasswordReset(
  body: ConfirmPasswordResetRequest,
): Promise<ConfirmPasswordResetResult> {
  return apiRequest<ConfirmPasswordResetResult>({
    path: '/api/auth/password-reset/confirm',
    method: 'POST',
    body,
    auth: 'none',
  });
}
