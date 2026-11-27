import { Music2 } from 'lucide-react-native';
import { Pressable } from 'react-native';

type TanpuraTriggerButtonProps = {
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
};

export function TanpuraTriggerButton({
  onPress,
  active = false,
  disabled = false,
}: TanpuraTriggerButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Tanpura"
      accessibilityState={{ disabled, selected: active }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      className="h-10 w-10 items-center justify-center rounded-full active:bg-surface-bright"
      style={{ opacity: disabled ? 0.4 : 1 }}>
      <Music2
        size={20}
        color={active ? '#D0BCFF' : '#CBC3D7'}
        strokeWidth={active ? 2.2 : 1.8}
      />
    </Pressable>
  );
}
