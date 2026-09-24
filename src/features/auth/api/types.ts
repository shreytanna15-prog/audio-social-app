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
