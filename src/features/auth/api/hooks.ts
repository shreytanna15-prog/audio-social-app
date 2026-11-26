import { useMutation } from '@tanstack/react-query';

import { setTokens } from '@/core/api';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { flushPreferredGenresDraft } from '@/features/onboarding/utils/flush-preferred-genres';

import { resetClientSession } from '../utils/reset-client-session';
import {
  confirmPasswordReset,
  login,
  requestPasswordReset,
  signup,
  verifyPasswordResetOtp,
} from './service';
import type {
  ConfirmPasswordResetRequest,
  LoginRequest,
  RequestPasswordResetRequest,
  SignupRequest,
  VerifyPasswordResetOtpRequest,
} from './types';

export function useLogin() {
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);

  return useMutation({
    mutationFn: (body: LoginRequest) => login(body),
    onSuccess: async (data) => {
      await setTokens(data.tokens);
      // Defense in depth if any prior-user cache survived logout.
      resetClientSession();
      completeOnboarding();
      setAuthenticated(true);
      await flushPreferredGenresDraft().catch(() => undefined);
    },
  });
}

export function useSignup() {
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const clearSignupDraft = useAuthStore((s) => s.clearSignupDraft);

  return useMutation({
    mutationFn: (body: SignupRequest) => signup(body),
    onSuccess: async (data) => {
      await setTokens(data.tokens);
      resetClientSession();
      clearSignupDraft();
      completeOnboarding();
      setAuthenticated(true);
      await flushPreferredGenresDraft().catch(() => undefined);
    },
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (body: RequestPasswordResetRequest) => requestPasswordReset(body),
  });
}

export function useVerifyPasswordResetOtp() {
  return useMutation({
    mutationFn: (body: VerifyPasswordResetOtpRequest) =>
      verifyPasswordResetOtp(body),
  });
}

export function useConfirmPasswordReset() {
  return useMutation({
    mutationFn: (body: ConfirmPasswordResetRequest) => confirmPasswordReset(body),
  });
}
