import { View } from 'react-native';

import { ProfileActionPill, PROFILE_PILL_GAP } from './profile-action-pill';

type ProfileSelfActionsProps = {
  onEditPress: () => void;
  onLibraryPress: () => void;
  onWalletPress: () => void;
};

export function ProfileSelfActions({
  onEditPress,
  onLibraryPress,
  onWalletPress,
}: ProfileSelfActionsProps) {
  return (
    <View className="w-full min-w-0 flex-1" style={{ gap: PROFILE_PILL_GAP }}>
      <View
        className="w-full min-w-0 flex-row items-center"
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
      <View className="w-full min-w-0">
        <ProfileActionPill
          tone="secondary"
          label="Wallet & Rewards"
          accessibilityLabel="Wallet and Rewards"
          onPress={onWalletPress}
        />
      </View>
    </View>
  );
}
