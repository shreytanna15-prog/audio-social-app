import type { TrackCommentDto } from '@/features/comments';
import { formatConversationTime } from '@/features/message/utils/format-message-time';

import type { PlayerComment } from '../data/player-comments';

function commentInitials(name: string | null, username: string): string {
  const source = (name?.trim() || username).replace(/^@/, '');
  return source.slice(0, 2).toUpperCase() || '?';
}

export function mapCommentToPlayerComment(
  dto: TrackCommentDto,
  nowMs: number = Date.now(),
): PlayerComment {
  return {
    id: dto.id,
    username: `@${dto.author.username}`,
    initials: commentInitials(dto.author.name, dto.author.username),
    timeAgo: formatConversationTime(dto.createdAt, nowMs),
    body: dto.body,
    likeCount: dto.likeCount,
    isLiked: dto.isLiked,
    isOwn: dto.isOwn,
    replies: dto.replies?.map((reply) => mapCommentToPlayerComment(reply, nowMs)),
  };
}

export function countComments(comments: PlayerComment[]): number {
  return comments.reduce(
    (total, comment) => total + 1 + (comment.replies?.length ?? 0),
    0,
  );
}
