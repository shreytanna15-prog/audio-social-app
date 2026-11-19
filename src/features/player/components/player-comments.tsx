import { ArrowUp, Heart } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { getErrorMessage } from '@/core/api/errors';
import {
  type CommentSort,
  useCreateTrackComment,
  useDeleteComment,
  useToggleCommentLike,
  useTrackComments,
} from '@/features/comments';
import { isApiTrackId } from '@/features/saves';
import { useFeedbackDialog } from '@/shared/components/ui/feedback-dialog';
import { embeddedInputClassName } from '@/shared/components/ui/field-styles';
import { Input } from '@/shared/components/ui/input';
import { Text } from '@/shared/components/ui/text';
import { cn } from '@/shared/lib/utils';

import { PLAYER_COMMENTS, type PlayerComment } from '../data/player-comments';
import {
  countComments,
  mapCommentToPlayerComment,
} from '../utils/map-comment-to-player-comment';

const COMMENT_MAX_LENGTH = 300;
const PREVIEW_COUNT = 3;

type PlayerCommentsProps = {
  trackId?: string;
  commentCount?: number;
  comments?: PlayerComment[];
};

type CommentRowProps = {
  comment: PlayerComment;
  onLike?: (comment: PlayerComment) => void;
  onReply?: (comment: PlayerComment) => void;
  onDelete?: (comment: PlayerComment) => void;
};

function CommentRow({ comment, onLike, onReply, onDelete }: CommentRowProps) {
  const liked = comment.isLiked === true;

  return (
    <View className="flex-row gap-3">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-container-highest">
        <Text variant="caption" className="font-semibold text-on-surface">
          {comment.initials}
        </Text>
      </View>

      <View className="min-w-0 flex-1 gap-1.5">
        <View className="flex-row items-center gap-2">
          <Text variant="label-md" className="font-semibold text-on-surface">
            {comment.username}
          </Text>
          <Text variant="caption" className="text-on-surface-variant">
            {comment.timeAgo}
          </Text>
        </View>

        <Text variant="body-md" className="text-on-surface">
          {comment.body}
        </Text>

        <View className="flex-row items-center gap-4">
          <Pressable
            onPress={onLike ? () => onLike(comment) : undefined}
            disabled={!onLike}
            accessibilityRole="button"
            accessibilityLabel={liked ? 'Unlike comment' : 'Like comment'}
            hitSlop={6}
            className="flex-row items-center gap-1">
            <Heart
              size={13}
              color={liked ? '#FFB0CD' : '#CBC3D7'}
              fill={liked ? '#FFB0CD' : 'transparent'}
              strokeWidth={1.8}
            />
            <Text variant="caption" className="text-on-surface-variant">
              {comment.likeCount}
            </Text>
          </Pressable>
          {onReply ? (
            <Pressable
              onPress={() => onReply(comment)}
              accessibilityRole="button"
              hitSlop={6}>
              <Text
                variant="caption"
                className="font-medium text-on-surface-variant">
                Reply
              </Text>
            </Pressable>
          ) : null}
          {onDelete && comment.isOwn ? (
            <Pressable
              onPress={() => onDelete(comment)}
              accessibilityRole="button"
              accessibilityLabel="Delete comment"
              hitSlop={6}>
              <Text
                variant="caption"
                className="font-medium text-on-surface-variant">
                Delete
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const SORT_OPTIONS: { value: CommentSort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'top', label: 'Top' },
];

type CommentsCardProps = {
  commentCount: number;
  comments: PlayerComment[];
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit?: () => void;
  posting?: boolean;
  replyingTo?: string | null;
  onCancelReply?: () => void;
  isLoading?: boolean;
  isError?: boolean;
  onViewAll?: () => void;
  sort?: CommentSort;
  onSortChange?: (sort: CommentSort) => void;
  onLike?: (comment: PlayerComment) => void;
  onReply?: (comment: PlayerComment) => void;
  onDelete?: (comment: PlayerComment) => void;
};

function CommentsCard({
  commentCount,
  comments,
  draft,
  onDraftChange,
  onSubmit,
  posting = false,
  replyingTo,
  onCancelReply,
  isLoading = false,
  isError = false,
  onViewAll,
  sort,
  onSortChange,
  onLike,
  onReply,
  onDelete,
}: CommentsCardProps) {
  return (
    <View className="gap-4 rounded-2xl border border-white/5 bg-surface-container p-4">
      <View className="flex-row items-center justify-between gap-3">
        <Text variant="title-md" className="text-on-surface">
          Comments ({commentCount})
        </Text>
        <Pressable
          accessibilityRole="link"
          hitSlop={8}
          onPress={onViewAll}>
          <Text variant="label-md" className="font-semibold text-primary-tonal">
            View all
          </Text>
        </Pressable>
      </View>

      {onSortChange && sort ? (
        <View className="flex-row gap-2">
          {SORT_OPTIONS.map((option) => {
            const selected = sort === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => onSortChange(option.value)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`Sort by ${option.label}`}
                className={cn(
                  'rounded-full px-3 py-1.5',
                  selected
                    ? 'bg-primary-tonal'
                    : 'bg-surface-container-highest',
                )}>
                <Text
                  variant="caption"
                  className={cn(
                    'font-semibold',
                    selected ? 'text-on-primary' : 'text-on-surface-variant',
                  )}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {isLoading && comments.length === 0 ? (
        <View className="items-center py-4">
          <ActivityIndicator color="#D0BCFF" />
        </View>
      ) : isError && comments.length === 0 ? (
        <Text variant="body-md" className="text-on-surface-variant">
          Couldn’t load comments.
        </Text>
      ) : (
        <View className="gap-4">
          {comments.map((comment) => (
            <View key={comment.id} className="gap-4">
              <CommentRow
                comment={comment}
                onLike={onLike}
                onReply={onReply}
                onDelete={onDelete}
              />
              {comment.replies && comment.replies.length > 0 ? (
                <View className="ml-12 gap-4">
                  {comment.replies.map((reply) => (
                    <CommentRow
                      key={reply.id}
                      comment={reply}
                      onLike={onLike}
                      onDelete={onDelete}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          ))}
        </View>
      )}

      {replyingTo ? (
        <View className="flex-row items-center justify-between px-1">
          <Text variant="caption" className="text-on-surface-variant">
            Replying to {replyingTo}
          </Text>
          <Pressable
            onPress={onCancelReply}
            accessibilityRole="button"
            hitSlop={6}>
            <Text variant="caption" className="font-semibold text-primary">
              Cancel
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View className="flex-row items-center gap-2 rounded-full bg-surface-container-high px-3 py-2">
        <Input
          value={draft}
          onChangeText={onDraftChange}
          placeholder="Add a comment..."
          maxLength={COMMENT_MAX_LENGTH}
          editable={!posting}
          returnKeyType="send"
          onSubmitEditing={onSubmit}
          className={cn(embeddedInputClassName, 'text-sm')}
        />
        <Pressable
          onPress={onSubmit}
          disabled={posting}
          accessibilityRole="button"
          accessibilityLabel="Post comment"
          className="h-8 w-8 items-center justify-center rounded-full bg-primary-tonal">
          <ArrowUp size={16} color="#3C0091" strokeWidth={2.4} />
        </Pressable>
      </View>
    </View>
  );
}

function FixtureComments({
  commentCount,
  comments,
}: {
  commentCount: number;
  comments: PlayerComment[];
}) {
  const [draft, setDraft] = useState('');

  return (
    <CommentsCard
      commentCount={commentCount}
      comments={comments}
      draft={draft}
      onDraftChange={setDraft}
    />
  );
}

function LiveComments({ trackId }: { trackId: string }) {
  const { showError, confirm, dialog } = useFeedbackDialog();
  const [sort, setSort] = useState<CommentSort>('newest');
  const commentsQuery = useTrackComments(trackId, sort);
  const createComment = useCreateTrackComment(trackId);
  const deleteComment = useDeleteComment(trackId);
  const toggleLike = useToggleCommentLike(trackId);

  const [draft, setDraft] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [replyTo, setReplyTo] = useState<PlayerComment | null>(null);

  const comments = useMemo(
    () => (commentsQuery.data ?? []).map((dto) => mapCommentToPlayerComment(dto)),
    [commentsQuery.data],
  );
  const visible = expanded ? comments : comments.slice(0, PREVIEW_COUNT);

  const submit = () => {
    const body = draft.trim();
    if (!body || createComment.isPending) return;

    void createComment
      .mutateAsync({ body, parentId: replyTo?.id ?? null })
      .then(() => {
        setDraft('');
        setReplyTo(null);
      })
      .catch((error) => {
        showError(
          'Could not post comment',
          getErrorMessage(error, 'Try again.'),
        );
      });
  };

  const removeComment = (comment: PlayerComment) => {
    confirm('Delete comment?', 'This cannot be undone.', {
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: () => {
        void deleteComment.mutateAsync(comment.id).catch((error) => {
          showError(
            'Could not delete comment',
            getErrorMessage(error, 'Try again.'),
          );
        });
      },
    });
  };

  return (
    <>
      <CommentsCard
        commentCount={countComments(comments)}
        comments={visible}
        draft={draft}
        onDraftChange={setDraft}
        onSubmit={submit}
        posting={createComment.isPending}
        replyingTo={replyTo?.username}
        onCancelReply={() => setReplyTo(null)}
        isLoading={commentsQuery.isLoading}
        isError={commentsQuery.isError}
        onViewAll={() => setExpanded((prev) => !prev)}
        sort={sort}
        onSortChange={setSort}
        onLike={(comment) =>
          toggleLike.mutate({
            commentId: comment.id,
            liked: comment.isLiked !== true,
          })
        }
        onReply={setReplyTo}
        onDelete={removeComment}
      />
      {dialog}
    </>
  );
}

export function PlayerComments({
  trackId,
  commentCount = 382,
  comments = PLAYER_COMMENTS,
}: PlayerCommentsProps) {
  if (trackId && isApiTrackId(trackId)) {
    return <LiveComments key={trackId} trackId={trackId} />;
  }

  return <FixtureComments commentCount={commentCount} comments={comments} />;
}
