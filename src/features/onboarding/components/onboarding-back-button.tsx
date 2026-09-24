import { Pressable } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

export function OnboardingBackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={8}
      className="h-10 w-10 items-center justify-center rounded-full active:bg-surface-bright">
      <ArrowLeft size={20} color="#E4E1EA" />
    </Pressable>
  );
}