import {
  AudioLines,
  Layers,
  MoreVertical,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { useFeedbackDialog } from '@/shared/components/ui/feedback-dialog';
import { Text } from '@/shared/components/ui/text';

import type { LibraryAudioItem } from '../types';
import { formatTrackCreatedAt } from '../utils/format-track-created-at';
import { libraryStorageLabel } from '../utils/map-track-to-library-item';

const ACCENT = '#A078FF';
const META = '#958EA0';
const ICON = '#D0BCFF';

const KIND_LABEL = {
  SINGLE: 'Single',
  MULTI: 'Multi',
} as const;

const KIND_ICON: Record<LibraryAudioItem['kind'], LucideIcon> = {
  SINGLE: AudioLines,
  MULTI: Layers,
};

type LibraryAudioRowProps = {
  item: LibraryAudioItem;
  onPress?: (item: LibraryAudioItem) => void;
  onMorePress?: (item: LibraryAudioItem) => void;
};

export function LibraryAudioRow({
  item,
  onPress,
  onMorePress,
}: LibraryAudioRowProps) {
  const { showError, dialog } = useFeedbackDialog();
  const Icon = KIND_ICON[item.kind];
  const statusLabel = libraryStorageLabel(item);
  const when = formatTrackCreatedAt(item.createdAt);
  const meta = when
    ? `${KIND_LABEL[item.kind]} • ${statusLabel} • ${when}`
    : `${KIND_LABEL[item.kind]} • ${statusLabel}`;

  return (
    <>
      <Pressable
        onPress={() => onPress?.(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, ${meta}`}
        className="mx-4 flex-row items-center gap-3 rounded-2xl border border-white/5 bg-surface-container px-3.5 py-3.5"
        style={{
          borderCurve: 'continuous',
          opacity: item.unavailable ? 0.55 : 1,
        }}>
        <View
          className="h-11 w-11 items-center justify-center rounded-xl"
          style={{ backgroundColor: 'rgba(160, 120, 255, 0.16)' }}>
          <Icon size={20} color={ICON} strokeWidth={2} />
        </View>

        <View className="min-w-0 flex-1 gap-1">
          <Text variant="title-md" className="text-on-surface" numberOfLines={1}>
            {item.title}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <View
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: ACCENT }}
            />
            <Text variant="caption" style={{ color: META }} numberOfLines={1}>
              {meta}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => {
            if (onMorePress) {
              onMorePress(item);
              return;
            }
            showError(item.title, 'Track options coming soon.');
          }}
          accessibilityRole="button"
          accessibilityLabel={`More options for ${item.title}`}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center">
          <MoreVertical size={18} color={META} strokeWidth={2} />
        </Pressable>
      </Pressable>
      {dialog}
    </>
  );
}
