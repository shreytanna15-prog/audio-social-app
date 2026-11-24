import { AudioLines, Mic, MoreVertical } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { ProjectTrack, ProjectTrackKind } from '../types';

const ICON_COLOR = '#CBC3D7';

function TrackKindIcon({ kind }: { kind: ProjectTrackKind }) {
  if (kind === 'MULTI') {
    return <AudioLines size={20} color={ICON_COLOR} strokeWidth={2} />;
  }
  return <Mic size={20} color={ICON_COLOR} strokeWidth={2} />;
}

type ProjectTrackRowProps = {
  track: ProjectTrack;
  onPress?: (track: ProjectTrack) => void;
  onMorePress?: (track: ProjectTrack) => void;
};

export function ProjectTrackRow({ track, onPress, onMorePress }: ProjectTrackRowProps) {
  return (
    <Pressable
      onPress={() => onPress?.(track)}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${track.title}`}
      className="flex-row items-center gap-3.5 rounded-2xl bg-surface-container px-4 py-3.5 active:bg-surface-container-high">
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-surface-container-highest">
        <TrackKindIcon kind={track.kind} />
      </View>

      <View className="min-w-0 flex-1 gap-1">
        <Text variant="title-md" className="text-on-surface" numberOfLines={1}>
          {track.title}
        </Text>
        <Text variant="caption" className="text-on-surface-variant" numberOfLines={1}>
          {track.metaLabel}
        </Text>
      </View>

      {onMorePress ? (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onMorePress(track);
          }}
          accessibilityRole="button"
          accessibilityLabel={`More options for ${track.title}`}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-white/10">
          <MoreVertical size={18} color="#958EA0" strokeWidth={2} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}
