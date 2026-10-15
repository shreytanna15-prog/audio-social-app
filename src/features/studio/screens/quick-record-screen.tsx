import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QuickRecordToolRow } from '@/features/studio/components/quick-record-tool-row';
import { QuickRecordTransport } from '@/features/studio/components/quick-record-transport';
import {
  QuickRecordTimeline,
  QuickRecordWaveform,
} from '@/features/studio/components/quick-record-waveform';
import { Text } from '@/shared/components/ui/text';

export function QuickRecordScreen() {
  const insets = useSafeAreaInsets();
  const { back, canGoBack } = useRouter();

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingBottom: Math.max(insets.bottom, 28) + 12 }}>
      {/* Header height matches AppHeader (safe area + 8 / 12 padding, h-10 row) */}
      <View
        className="border-b border-white/5 px-4"
        style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}>
        <View className="h-10 flex-row items-center justify-between">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            onPress={() => {
              if (canGoBack()) back();
            }}
            className="h-10 w-10 items-center justify-center rounded-full active:bg-surface-bright">
            <ArrowLeft size={20} color="#E4E1EA" strokeWidth={2} />
          </Pressable>

          <Text variant="title-md" className="text-on-surface">
            Quick Record
          </Text>

          <View className="h-10 w-10" />
        </View>
      </View>

      <View className="px-4 pt-3">
        <View className="flex-row items-end justify-between pb-2">
          <View className="flex-row items-baseline gap-1.5">
            <Text variant="headline-lg-mobile" className="text-on-surface">
              00:00.0
            </Text>
            <Text variant="body-md" className="text-on-surface-variant">
              / 03:00.0
            </Text>
          </View>

          <View className="rounded-full border border-white/10 bg-surface-container px-3 py-1.5">
            <Text variant="label-sm" className="text-on-surface">
              Untitled take
            </Text>
          </View>
        </View>

        <QuickRecordTimeline />
      </View>

      {/* Middle — waveform + full-height playhead fills remaining space */}
      <View className="flex-1 px-4 pt-3 pb-4">
        <QuickRecordWaveform />
      </View>

      {/* Bottom — effect chips + centered 5-button transport */}
      <View className="gap-6 px-4 pt-2 pb-5">
        <QuickRecordToolRow />
        <QuickRecordTransport />
      </View>
    </View>
  );
}
