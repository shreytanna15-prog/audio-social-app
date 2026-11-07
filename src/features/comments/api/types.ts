export type CommentSort = 'newest' | 'top';

export type CommentAuthorDto = {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
};

export type TrackCommentDto = {
  id: string;
  body: string;
  createdAt: string;
  likeCount: number;
  isLiked: boolean;
  isOwn: boolean;
  author: CommentAuthorDto;
  replies?: TrackCommentDto[];
};

export type CreateCommentRequest = {
  body: string;
  parentId?: string | null;
};

export type CommentLikeResponse = {
  id: string;
  likeCount: number;
  isLiked: boolean;
};

export type DeleteCommentResponse = {
  id: string;
  commentCount: number;
};
