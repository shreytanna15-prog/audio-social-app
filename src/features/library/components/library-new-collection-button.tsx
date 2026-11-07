import { Plus } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { Text } from '@/shared/components/ui/text';

type LibraryNewCollectionButtonProps = {
  label: string;
  onPress: () => void;
};

export function LibraryNewCollectionButton({
  label,
  onPress,
}: LibraryNewCollectionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      className="flex-row items-center gap-1 rounded-full border border-white/10 px-2.5 py-1">
      <Plus size={12} color="#D0BCFF" strokeWidth={2.4} />
      <Text variant="caption" className="font-semibold text-primary">
        New
      </Text>
    </Pressable>
  );
}
