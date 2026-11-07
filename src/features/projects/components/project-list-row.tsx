import { ChevronRight, Folder, MoreVertical } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { ProjectSummary } from '../types';

type ProjectListRowProps = {
  project: ProjectSummary;
  onPress?: (project: ProjectSummary) => void;
  onMorePress?: (project: ProjectSummary) => void;
};

export function ProjectListRow({
  project,
  onPress,
  onMorePress,
}: ProjectListRowProps) {
  const itemLabel = project.trackCount === 1 ? 'item' : 'items';
  const meta = `${project.trackCount} ${itemLabel} · ${project.updatedLabel}`;

  return (
    <Pressable
      onPress={() => onPress?.(project)}
      accessibilityRole="button"
      accessibilityLabel={`${project.title}, ${meta}`}
      className="mx-4 flex-row items-center gap-3 rounded-2xl border border-white/5 bg-surface-container px-3.5 py-3.5"
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary-container/20">
        <Folder size={20} color="#D0BCFF" strokeWidth={2} />
      </View>

      <View className="min-w-0 flex-1 gap-0.5">
        <Text variant="title-md" className="text-on-surface" numberOfLines={1}>
          {project.title}
        </Text>
        <Text
          variant="caption"
          className="text-on-surface-variant"
          numberOfLines={1}>
          {meta}
        </Text>
      </View>

      <Pressable
        onPress={() => {
          if (onMorePress) {
            onMorePress(project);
            return;
          }
          onPress?.(project);
        }}
        accessibilityRole="button"
        accessibilityLabel={`More options for ${project.title}`}
        hitSlop={8}
        className="h-9 w-9 items-center justify-center">
        <MoreVertical size={18} color="#958EA0" strokeWidth={2} />
      </Pressable>

      <ChevronRight size={18} color="#958EA0" strokeWidth={2} />
    </Pressable>
  );
}
