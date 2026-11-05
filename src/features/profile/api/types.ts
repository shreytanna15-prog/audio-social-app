export type MeDto = {
  id: string;
  email: string;
  username: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  canChangeUsername: boolean;
  usernameChangeAvailableAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PatchProfileBody = {
  name?: string | null;
  bio?: string | null;
  username?: string;
};

export type UsernameAvailability = {
  username: string;
  available: boolean;
};

export type ProfileImageContentType =
  | 'image/jpeg'
  | 'image/jpg'
  | 'image/png'
  | 'image/webp';

export type ProfileMediaUpload = {
  path: string;
  signedUrl: string;
};

export type ProfileMediaCompleteBody = {
  path: string;
  contentType: ProfileImageContentType;
};
