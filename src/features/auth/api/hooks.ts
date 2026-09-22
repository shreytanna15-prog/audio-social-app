import { useMutation } from '@tanstack/react-query';

import { setTokens } from '@/core/api';
import { useAuthStore } from '@/features/auth/store/auth.store';

import { login, signup } from './service';
import type { LoginRequest, SignupRequest } from './types';

export function useLogin() {
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);

  return useMutation({
    mutationFn: (body: LoginRequest) => login(body),
    onSuccess: async (data) => {
      await setTokens(data.tokens);
      completeOnboarding();
      setAuthenticated(true);
    },
  });
}

export function useSignup() {
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);

  return useMutation({
    mutationFn: (body: SignupRequest) => signup(body),
    onSuccess: async (data) => {
      await setTokens(data.tokens);
      completeOnboarding();
      setAuthenticated(true);
    },
  });
}
