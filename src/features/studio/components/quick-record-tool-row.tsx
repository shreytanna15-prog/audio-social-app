import {
  AudioLines,
  Music2,
  Repeat2,
  SlidersHorizontal,
  Sparkles,
  Waves,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

/** Same effect names as the studio recording editor (labels only for now). */
const TOOLS: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: 'clean-voice', label: 'Clean Voice', Icon: Sparkles },
  { id: 'fx', label: 'FX', Icon: Music2 },
  { id: 'compressor', label: 'Compressor', Icon: SlidersHorizontal },
  { id: 'eq', label: 'EQ', Icon: AudioLines },
  { id: 'echo', label: 'Echo', Icon: Repeat2 },
  { id: 'reverb', label: 'Reverb', Icon: Waves },
];

export function QuickRecordToolRow() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-3.5 px-0">
      {TOOLS.map(({ id, label, Icon }) => (
        <Pressable
          key={id}
          accessibilityRole="button"
          accessibilityLabel={label}
          className="flex-row items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-surface-container px-3 py-2"
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
          <Icon size={14} color="#CBC3D7" strokeWidth={2} />
          <Text variant="label-sm" className="text-on-surface">
            {label}
          </Text>
        </Pressable>
      ))}
      <View className="w-1" />
    </ScrollView>
  );
}
