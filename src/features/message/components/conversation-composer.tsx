import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { Mic, Plus, SendHorizontal, Smile, Square } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { embeddedInputClassName } from '@/shared/components/ui/field-styles';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/lib/utils';

const ACCENT = '#D0BCFF';
const ICON = '#CBC3D7';

type ConversationComposerProps = {
  onSend: (text: string) => void;
  onSendVoiceNote?: (input: { uri: string; durationMs: number }) => void;
  sending?: boolean;
  /** Override bottom safe-area padding (e.g. while IME is open). */
  bottomPadding?: number;
};

export function ConversationComposer({
  onSend,
  onSendVoiceNote,
  sending = false,
  bottomPadding,
}: ConversationComposerProps) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const startedAtRef = useRef<number | null>(null);
  const [recordingBusy, setRecordingBusy] = useState(false);

  const canSend = draft.trim().length > 0 && !sending;
  const isRecording = recorderState.isRecording;
  const resolvedBottomPad = bottomPadding ?? Math.max(insets.bottom, 10);

  useEffect(() => {
    return () => {
      if (recorderState.isRecording) {
        void recorder.stop().catch(() => undefined);
      }
    };
  }, [recorder, recorderState.isRecording]);

  const handleSend = () => {
    if (!canSend) return;
    onSend(draft);
    setDraft('');
  };

  const startRecording = async () => {
    if (!onSendVoiceNote || recordingBusy || sending) return;
    try {
      setRecordingBusy(true);
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) return;

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
      startedAtRef.current = Date.now();
    } finally {
      setRecordingBusy(false);
    }
  };

  const stopRecording = async () => {
    if (!onSendVoiceNote || !isRecording) return;
    try {
      setRecordingBusy(true);
      await recorder.stop();
      const uri = recorder.uri;
      const durationMs = Math.max(
        1,
        Date.now() - (startedAtRef.current ?? Date.now()),
      );
      startedAtRef.current = null;
      if (uri) {
        onSendVoiceNote({ uri, durationMs });
      }
    } finally {
      setRecordingBusy(false);
    }
  };

  return (
    <View
      className="border-t border-white/5 bg-background px-3 pt-2.5"
      style={{ paddingBottom: resolvedBottomPad }}>
      <View className="flex-row items-end gap-2.5">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add attachment"
          hitSlop={6}
          className="mb-0.5 h-11 w-11 items-center justify-center rounded-full bg-surface-container-high">
          <Plus size={22} color={ICON} strokeWidth={2.2} />
        </Pressable>

        <View className="min-w-0 flex-1 flex-row items-center gap-2 rounded-full bg-surface-container-high px-4 py-2.5">
          <Textarea
            value={draft}
            onChangeText={setDraft}
            placeholder={isRecording ? 'Recording…' : 'Message...'}
            multiline
            editable={!isRecording && !sending}
            maxLength={2000}
            returnKeyType="default"
            blurOnSubmit={false}
            scrollEnabled={false}
            numberOfLines={1}
            accessibilityLabel="Message input"
            className={cn(
              embeddedInputClassName,
              'max-h-28 min-h-0 rounded-none py-0',
            )}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Emoji"
            hitSlop={6}
            className="h-8 w-8 items-center justify-center">
            <Smile size={20} color={ICON} strokeWidth={1.8} />
          </Pressable>
        </View>

        {canSend ? (
          <Pressable
            onPress={handleSend}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            className="mb-0.5 h-11 w-11 items-center justify-center rounded-full"
            style={{ backgroundColor: ACCENT }}>
            {sending ? (
              <ActivityIndicator color="#1B1B21" />
            ) : (
              <SendHorizontal size={20} color="#1B1B21" strokeWidth={2.4} />
            )}
          </Pressable>
        ) : (
          <Pressable
            onPress={isRecording ? stopRecording : startRecording}
            disabled={!onSendVoiceNote || recordingBusy || sending}
            accessibilityRole="button"
            accessibilityLabel={
              isRecording ? 'Stop voice note' : 'Record voice note'
            }
            className="mb-0.5 h-11 w-11 items-center justify-center rounded-full"
            style={{
              backgroundColor: ACCENT,
              opacity: onSendVoiceNote ? 1 : 0.5,
            }}>
            {recordingBusy || sending ? (
              <ActivityIndicator color="#1B1B21" />
            ) : isRecording ? (
              <Square size={18} color="#1B1B21" strokeWidth={2.6} />
            ) : (
              <Mic size={20} color="#1B1B21" strokeWidth={2.4} />
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}
