import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

export type CreateOptionRowProps = {
  title: string;
  description: string;
  Icon: LucideIcon;
  onPress?: () => void;
  disabled?: boolean;
  /** Defaults to white; Import Audio uses brand purple. */
  iconColor?: string;
};

export function CreateOptionRow({
  title,
  description,
  Icon,
  onPress,
  disabled = false,
  iconColor = '#FFFFFF',
}: CreateOptionRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className="flex-row items-center gap-3.5 rounded-2xl border border-white/5 bg-surface-container px-3.5 py-3.5"
      style={({ pressed }) => ({
        opacity: disabled ? 0.5 : pressed ? 0.88 : 1,
      })}>
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-surface-container-highest">
        <Icon size={22} color={iconColor} strokeWidth={2.1} />
      </View>

      <View className="min-w-0 flex-1 gap-0.5">
        <Text variant="title-md" className="text-on-surface">
          {title}
        </Text>
        <Text variant="body-md" className="text-on-surface-variant">
          {description}
        </Text>
      </View>

      <ChevronRight size={18} color="#958EA0" strokeWidth={2} />
    </Pressable>
  );
}
