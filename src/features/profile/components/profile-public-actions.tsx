import { View } from 'react-native';

import { ProfileActionPill, PROFILE_PILL_GAP } from './profile-action-pill';

type ProfilePublicActionsProps = {
  name: string;
  following: boolean;
  onToggleFollow: () => void;
  onMessagePress: () => void;
};

export function ProfilePublicActions({
  name,
  following,
  onToggleFollow,
  onMessagePress,
}: ProfilePublicActionsProps) {
  return (
    <View
      className="min-w-0 flex-1 flex-row items-center"
      style={{ gap: PROFILE_PILL_GAP }}>
      <ProfileActionPill
        tone={following ? 'secondary' : 'primary'}
        label={following ? 'Following' : 'Follow'}
        accessibilityLabel={following ? `Unfollow ${name}` : `Follow ${name}`}
        onPress={onToggleFollow}
      />
      <ProfileActionPill
        tone="secondary"
        label="Message"
        accessibilityLabel={`Message ${name}`}
        onPress={onMessagePress}
      />
    </View>
  );
}
