import { Plus } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { Text } from '@/shared/components/ui/text';

type LibraryNewCollectionButtonProps = {
  label: string;
  onPress: () => void;
};

/** Matches Filter / eye header controls: h-9, rounded-xl, shared surface. */
export function LibraryNewCollectionButton({
  label,
  onPress,
}: LibraryNewCollectionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="h-9 flex-row items-center gap-1.5 rounded-xl border border-white/10 bg-surface-container-highest px-3 active:opacity-80"
      style={{ borderCurve: 'continuous' }}>
      <Plus size={16} color="#D0BCFF" strokeWidth={2.25} />
      <Text variant="label-md" className="text-on-surface">
        New
      </Text>
    </Pressable>
  );
}
