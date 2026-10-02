export type PlayerTrack = {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  artistAvatarUrl?: string;
  playsLabel?: string;
  likeCountLabel?: string;
  commentCount?: number;
  durationSec?: number;
  verified?: boolean;
};
