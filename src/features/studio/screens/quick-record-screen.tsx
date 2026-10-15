import { ArrowLeft } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAudioRecorderBinding } from '@/features/audio/hooks/use-audio-recorder-binding';
import { recordingSessionService } from '@/features/audio/services/recording-session.service';
import { QuickRecordTimer } from '@/features/studio/components/quick-record-timer';
import { QuickRecordToolRow } from '@/features/studio/components/quick-record-tool-row';
import { QuickRecordTransport } from '@/features/studio/components/quick-record-transport';
import {
  QuickRecordTimeline,
  QuickRecordWaveform,
} from '@/features/studio/components/quick-record-waveform';
import { useQuickRecordSession } from '@/features/studio/hooks/use-quick-record-session';
import { Text } from '@/shared/components/ui/text';

export function QuickRecordScreen() {
  const insets = useSafeAreaInsets();
  useAudioRecorderBinding();
  const session = useQuickRecordSession();

  const displaySeconds = session.isPlaying
    ? session.currentTime
    : session.durationSeconds;
  const progress =
    session.durationSeconds > 0
      ? session.currentTime / session.durationSeconds
      : 0;

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingBottom: Math.max(insets.bottom, 28) + 12 }}>
      <View
        className="border-b border-white/5 px-4"
        style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}>
        <View className="h-10 flex-row items-center justify-between">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            onPress={session.requestClose}
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
          <QuickRecordTimer
            isRecording={session.isRecording}
            displaySeconds={displaySeconds}
            maxSeconds={session.maxSeconds}
          />

          <View className="rounded-full border border-white/10 bg-surface-container px-3 py-1.5">
            <Text variant="label-sm" className="text-on-surface">
              {session.isOptimizing
                ? 'Processing…'
                : session.isCleaning
                  ? 'Cleaning…'
                  : session.fxProcessing
                    ? 'Applying FX…'
                    : 'Untitled take'}
            </Text>
          </View>
        </View>

        <QuickRecordTimeline
          isRecording={session.isRecording}
          durationSeconds={session.durationSeconds}
        />
      </View>

      <View className="flex-1 px-4 pt-3 pb-4">
        <QuickRecordWaveform
          peaks={session.peaks}
          isRecording={session.isRecording}
          hasTake={session.hasTake}
          progress={progress}
        />
      </View>

      <View className="gap-6 px-4 pt-2 pb-5">
        <QuickRecordToolRow
          layerId={session.layerId}
          baselineUri={session.baselineUri}
          stemUri={session.stemUri}
          sourceUri={session.sourceUri}
          initialEditChain={session.editChain}
          durationSeconds={session.durationSeconds}
          isSaving={session.isSaving || session.isRecording || session.isOptimizing}
          disabled={session.isRecording || session.isOptimizing}
          onStemChange={session.onStemChange}
          onProcessingChange={session.setFxProcessing}
        />
        <QuickRecordTransport
          isRecording={session.isRecording}
          isOptimizing={session.isOptimizing}
          isSaving={session.isSaving}
          isPlaying={session.isPlaying}
          hasTake={session.hasTake}
          onSave={() => void session.save()}
          onTogglePlayback={session.togglePlayback}
          onToggleRecord={session.toggleRecord}
          onStopRecordPressIn={() => recordingSessionService.requestStop()}
        />
      </View>
    </View>
  );
}
