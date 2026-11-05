export type AuthUser = {
  id: string;
  email: string;
  username: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthSessionData = {
  user: AuthUser;
  tokens: AuthTokens;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type SignupRequest = {
  name: string;
  username: string;
  email: string;
  password: string;
};

export type RefreshData = {
  accessToken: string;
  refreshToken: string;
};

export type RequestPasswordResetRequest = {
  email: string;
};

export type RequestPasswordResetResult = {
  ok: true;
  resendAvailableAt: string | null;
};

export type VerifyPasswordResetOtpRequest = {
  email: string;
  otp: string;
};

export type VerifyPasswordResetOtpResult = {
  resetToken: string;
};

export type ConfirmPasswordResetRequest = {
  resetToken: string;
  password: string;
};

export type ConfirmPasswordResetResult = {
  ok: true;
};
