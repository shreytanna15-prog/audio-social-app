import { ArrowRight, Folder } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

type ProjectCardProps = {
  title?: string;
  version?: string;
  meta?: string;
  description?: string | null;
  onOpenPress?: () => void;
};

export function ProjectCard({
  title = 'Untitled Project',
  version,
  meta,
  description,
  onOpenPress,
}: ProjectCardProps) {
  return (
    <View className="mx-4 rounded-2xl border border-white/8 bg-surface-container p-4">
      {/* Top section: Folder icon + Title & metadata */}
      <View className="flex-row items-start gap-3.5">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary-container/20 border border-primary/20">
          <Folder size={22} color="#D0BCFF" strokeWidth={2} />
        </View>

        <View className="min-w-0 flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Text variant="title-md" className="text-on-surface font-semibold" numberOfLines={1}>
              {title}
            </Text>
            {version ? (
              <View className="rounded-md bg-surface-container-highest px-2 py-0.5">
                <Text variant="caption" className="text-on-surface-variant text-[11px] font-medium">
                  {version}
                </Text>
              </View>
            ) : null}
          </View>

          {description ? (
            <Text variant="caption" className="text-on-surface-variant leading-4" numberOfLines={1}>
              {description}
            </Text>
          ) : null}

          {meta ? (
            <Text variant="caption" className="text-on-surface-variant/70 text-[12px]" numberOfLines={1}>
              {meta}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Bottom section: single right-aligned Open Project button */}
      <View className="mt-3.5 pt-3 border-t border-white/6 flex-row items-center justify-end">
        <Pressable
          onPress={onOpenPress}
          accessibilityRole="button"
          accessibilityLabel={`Open project ${title}`}
          className="h-9 flex-row items-center gap-1.5 rounded-full bg-primary/15 px-3.5 border border-primary/25 active:bg-primary/25">
          <Text variant="label-md" className="font-semibold text-primary">
            Open Project
          </Text>
          <ArrowRight size={14} color="#D0BCFF" strokeWidth={2.2} />
        </Pressable>
      </View>
    </View>
  );
}
