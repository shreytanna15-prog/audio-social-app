import { AudioLines, Mic } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

type ProjectCardProps = {
  title?: string;
  version?: string;
  meta?: string;
  format?: string;
  status?: string;
  onOpenPress?: () => void;
};

export function ProjectCard({
  title = 'Midnight Drift',
  version = 'v3',
  meta = '4 Stems recorded • 2h ago',
  format = '48kHz / 24-bit FLAC',
  status = 'Draft Master',
  onOpenPress,
}: ProjectCardProps) {
  return (
    <View className="mx-4 rounded-2xl border border-white/5 bg-surface-container p-4">
      <View className="flex-row items-start gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-xl bg-surface-container-high">
          <AudioLines size={22} color="#E4E1EA" strokeWidth={2} />
        </View>

        <View className="min-w-0 flex-1 gap-1">
          <View className="flex-row items-start justify-between gap-2">
            <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-2">
              <Text variant="title-md" className="text-on-surface" numberOfLines={1}>
                {title}
              </Text>
              <View className="rounded-full bg-surface-container-highest px-2 py-0.5">
                <Text variant="caption" className="text-on-surface-variant">
                  {version}
                </Text>
              </View>
            </View>

            <Text variant="caption" className="shrink-0 font-medium text-[#E8A0A0]">
              {status}
            </Text>
          </View>

          <Text variant="body-md" className="text-on-surface-variant">
            {meta}
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1 flex-row items-center gap-2">
          <View className="h-1.5 w-1.5 rounded-full bg-primary-tonal" />
          <Text variant="caption" className="text-on-surface-variant" numberOfLines={1}>
            {format}
          </Text>
        </View>

        <Pressable
          onPress={onOpenPress}
          accessibilityRole="button"
          accessibilityLabel="Open project"
          className="h-10 flex-row items-center gap-1.5 rounded-full bg-primary-tonal px-3.5">
          <Mic size={15} color="#3C0091" strokeWidth={2.2} />
          <Text variant="label-md" className="font-semibold text-on-primary">
            Open Project
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
