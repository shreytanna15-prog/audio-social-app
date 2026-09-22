import { Pressable } from 'react-native';

import { OnboardingIcon } from './onboarding-icon';

export function OnboardingBackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={8}
      className="h-10 w-10 items-center justify-center rounded-full bg-surface-container active:bg-surface-bright">
      <OnboardingIcon name="arrow-back" size={20} color="#E4E1EA" />
    </Pressable>
  );
}