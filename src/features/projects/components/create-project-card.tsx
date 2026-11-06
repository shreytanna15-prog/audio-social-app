import { FolderPlus, Plus } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

type CreateProjectCardProps = {
  onPress?: () => void;
  disabled?: boolean;
};

export function CreateProjectCard({
  onPress,
  disabled = false,
}: CreateProjectCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Create project"
      disabled={disabled}
      onPress={onPress}
      className="mx-4 overflow-hidden rounded-2xl border border-white/5 bg-surface-container"
      style={({ pressed }) => ({
        opacity: disabled ? 0.9 : pressed ? 0.9 : 1,
      })}>
      <View className="flex-row items-center gap-3.5 px-4 py-4">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-surface-container-highest">
          <FolderPlus size={22} color="#E4E1EA" strokeWidth={2.2} />
        </View>

        <View className="min-w-0 flex-1 gap-1">
          <Text variant="title-md" className="text-on-surface">
            Create Project
          </Text>
          <Text variant="body-md" className="text-on-surface-variant">
            Organize your recordings and audio sessions.
          </Text>
        </View>

        <View className="h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5">
          <Plus size={18} color="#E4E1EA" strokeWidth={2.2} />
        </View>
      </View>
    </Pressable>
  );
}
