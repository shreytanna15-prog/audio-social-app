import { AudioLines, FileUp, Mic } from 'lucide-react-native';
import { View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { ProjectTrack, ProjectTrackKind } from '../types';

const ICON_COLOR = '#CBC3D7';

function TrackKindIcon({ kind }: { kind: ProjectTrackKind }) {
  if (kind === 'multitrack') {
    return <AudioLines size={20} color={ICON_COLOR} strokeWidth={2} />;
  }
  if (kind === 'import') {
    return <FileUp size={20} color={ICON_COLOR} strokeWidth={2} />;
  }
  return <Mic size={20} color={ICON_COLOR} strokeWidth={2} />;
}

type ProjectTrackRowProps = {
  track: ProjectTrack;
};

/** Static display row — track open/edit not wired yet. */
export function ProjectTrackRow({ track }: ProjectTrackRowProps) {
  return (
    <View className="flex-row items-center gap-3.5 rounded-2xl bg-surface-container px-4 py-3.5">
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
    </View>
  );
}
