export type PlayerComment = {
  id: string;
  username: string;
  initials: string;
  timeAgo: string;
  body: string;
  likeCount: number;
  isLiked?: boolean;
  isOwn?: boolean;
  replies?: PlayerComment[];
};

export const PLAYER_COMMENTS: PlayerComment[] = [
  {
    id: '1',
    username: '@kaelenvoss',
    initials: 'KV',
    timeAgo: '12m',
    body: 'That vocal flip around 1:40 is unreal. Stem pack when?',
    likeCount: 48,
  },
  {
    id: '2',
    username: '@mayalinsounds',
    initials: 'MS',
    timeAgo: '28m',
    body: 'Layered this under a lo-fi beat and it melted. Absolute heat.',
    likeCount: 31,
  },
  {
    id: '3',
    username: '@somawaves',
    initials: 'SW',
    timeAgo: '1h',
    body: 'The Rhodes + breathy stack combo is chef’s kiss.',
    likeCount: 19,
  },
];
