export type AuthUser = {
  id: string;
  email: string;
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
  email: string;
  password: string;
  name?: string;
};

export type RefreshData = {
  accessToken: string;
  refreshToken: string;
};
