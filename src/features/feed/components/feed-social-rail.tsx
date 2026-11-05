import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import {
  FEED_SOCIAL_ICON_SIZE,
  FeedCommentIcon,
  FeedLikeIcon,
  FeedSaveIcon,
  FeedShareNetworkIcon,
} from './feed-social-icons';

type FeedSocialRailProps = {
  likesLabel: string;
  commentsLabel: string;
  sharesLabel: string;
  liked: boolean;
  saved: boolean;
  onLikePress: () => void;
  onCommentPress: () => void;
  onSharePress: () => void;
  onSavePress: () => void;
};

/** Equal gap between each circular icon (label sits in this gap) */
const ICON_GAP = 32;
const LABEL_OFFSET = 4;

function RailAction({
  label,
  onPress,
  accessibilityLabel,
  children,
}: {
  label?: string;
  onPress: () => void;
  accessibilityLabel: string;
  children: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="items-center"
      style={{ width: FEED_SOCIAL_ICON_SIZE, height: FEED_SOCIAL_ICON_SIZE }}
      hitSlop={4}>
      {children}
      {label ? (
        <Text
          className="absolute left-0 right-0 text-center font-sans text-[11px] font-medium leading-[14px] text-white"
          style={{ top: FEED_SOCIAL_ICON_SIZE + LABEL_OFFSET }}
          pointerEvents="none">
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function FeedSocialRail({
  likesLabel,
  commentsLabel,
  sharesLabel,
  liked,
  saved,
  onLikePress,
  onCommentPress,
  onSharePress,
  onSavePress,
}: FeedSocialRailProps) {
  return (
    <View className="items-center" style={{ gap: ICON_GAP }}>
      <RailAction label={likesLabel} onPress={onLikePress} accessibilityLabel="Like">
        <FeedLikeIcon active={liked} />
      </RailAction>
      <RailAction label={commentsLabel} onPress={onCommentPress} accessibilityLabel="Comments">
        <FeedCommentIcon />
      </RailAction>
      <RailAction label={sharesLabel} onPress={onSharePress} accessibilityLabel="Share">
        <FeedShareNetworkIcon />
      </RailAction>
      <RailAction onPress={onSavePress} accessibilityLabel={saved ? 'Unsave' : 'Save'}>
        <FeedSaveIcon active={saved} />
      </RailAction>
    </View>
  );
}
