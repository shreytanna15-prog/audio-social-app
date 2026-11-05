import { View } from 'react-native';

import { ProfileActionPill, PROFILE_PILL_GAP } from './profile-action-pill';

type ProfileSelfActionsProps = {
  onEditPress: () => void;
  onLibraryPress: () => void;
};

export function ProfileSelfActions({
  onEditPress,
  onLibraryPress,
}: ProfileSelfActionsProps) {
  return (
    <View
      className="min-w-0 flex-1 flex-row items-center"
      style={{ gap: PROFILE_PILL_GAP }}>
      <ProfileActionPill
        tone="primary"
        label="Edit profile"
        accessibilityLabel="Edit profile"
        onPress={onEditPress}
      />
      <ProfileActionPill
        tone="secondary"
        label="Library"
        accessibilityLabel="Library"
        onPress={onLibraryPress}
      />
    </View>
  );
}
