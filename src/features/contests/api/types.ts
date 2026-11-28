export type ContestPhase =
  | 'upcoming'
  | 'announce'
  | 'submit'
  | 'vote'
  | 'closed'
  | 'cancelled';

export type ContestSummary = {
  id: string;
  title: string;
  description: string;
  rules: string;
  genreIds: string[];
  prizeNote: string;
  placementMode: 'FIRST' | 'TOP_THREE';
  payoutMode: 'MANUAL' | 'AUTO';
  prizeCoinsFirst: number;
  prizeCoinsSecond: number | null;
  prizeCoinsThird: number | null;
  resultsVisibleDays: number;
  phase: ContestPhase;
  announceAt: string;
  submitStartAt: string;
  submitEndAt: string;
  voteEndAt: string;
  entryCount: number;
  voteCount: number;
  winnersConfirmed: boolean;
  cancelled: boolean;
};

export type ContestDetail = ContestSummary & {
  hasEntered: boolean;
  hasVoted: boolean;
  myEntryId: string | null;
};

export type ContestEntry = {
  id: string;
  contestId: string;
  userId: string;
  trackId: string;
  createdAt: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  trackTitle: string;
  trackCoverUrl: string | null;
  voteCount?: number;
};

export type LeaderboardRow = ContestEntry & {
  voteCount: number;
  placeBand: 1 | 2 | 3 | null;
  prizeCoins: number;
};

export type EligibleTrack = {
  id: string;
  title: string;
  coverUrl: string | null;
  genres: string[];
  publishedAt: string | null;
};
