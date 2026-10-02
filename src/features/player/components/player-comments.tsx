import { ArrowUp, Heart } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import { PLAYER_COMMENTS, type PlayerComment } from '../data/player-comments';

type PlayerCommentsProps = {
  commentCount?: number;
  comments?: PlayerComment[];
};

function CommentRow({ comment }: { comment: PlayerComment }) {
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
          <View className="flex-row items-center gap-1">
            <Heart size={13} color="#CBC3D7" strokeWidth={1.8} />
            <Text variant="caption" className="text-on-surface-variant">
              {comment.likeCount}
            </Text>
          </View>
          <Pressable accessibilityRole="button" hitSlop={6}>
            <Text variant="caption" className="font-medium text-on-surface-variant">
              Reply
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function PlayerComments({
  commentCount = 382,
  comments = PLAYER_COMMENTS,
}: PlayerCommentsProps) {
  const [draft, setDraft] = useState('');

  return (
    <View className="gap-4 rounded-2xl border border-white/5 bg-surface-container p-4">
      <View className="flex-row items-center justify-between">
        <Text variant="title-md" className="text-on-surface">
          Comments ({commentCount})
        </Text>
        <Pressable accessibilityRole="link" hitSlop={8}>
          <Text variant="label-md" className="font-semibold text-primary-tonal">
            View all
          </Text>
        </Pressable>
      </View>

      <View className="gap-4">
        {comments.map((comment) => (
          <CommentRow key={comment.id} comment={comment} />
        ))}
      </View>

      <View className="flex-row items-center gap-2 rounded-full bg-surface-container-high px-3 py-2">
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Add a comment..."
          placeholderTextColor="#958EA0"
          className="min-w-0 flex-1 font-sans text-sm text-on-surface"
          style={{ padding: 0 }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Post comment"
          className="h-8 w-8 items-center justify-center rounded-full bg-primary-tonal">
          <ArrowUp size={16} color="#3C0091" strokeWidth={2.4} />
        </Pressable>
      </View>
    </View>
  );
}
