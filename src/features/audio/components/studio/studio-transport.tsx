import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { IconButton } from '@/features/audio/components/icon-button';
import { recordingSessionService } from '@/features/audio/services/recording-session.service';

type StudioTransportProps = {
  isRecording: boolean;
  isPaused: boolean;
  isPlaying: boolean;
  disabled?: boolean;
  onRecord: () => void;
  onStop: () => void;
  onRecordFromStart: () => void;
  onPauseResume: () => void;
  onTogglePlay: () => void;
};

export function StudioTransport({
  isRecording,
  isPaused,
  isPlaying,
  disabled = false,
  onRecord,
  onStop,
  onRecordFromStart,
  onPauseResume,
  onTogglePlay,
}: StudioTransportProps) {
  const fromStartDisabled = disabled || isRecording;

  return (
    <View style={styles.container}>
      <IconButton
        icon={{
          ios: isPlaying ? 'pause.fill' : 'play.fill',
          android: isPlaying ? 'pause' : 'play_arrow',
          web: isPlaying ? 'pause' : 'play_arrow',
        }}
        disabled={disabled || isRecording}
        onPress={onTogglePlay}
      />

      <Pressable
        disabled={fromStartDisabled}
        onPress={onRecordFromStart}
        accessibilityRole="button"
        accessibilityLabel="Record from start"
        style={({ pressed }) => [
          styles.fromStart,
          fromStartDisabled && styles.fromStartDisabled,
          pressed && !fromStartDisabled && styles.fromStartPressed,
        ]}>
        <SymbolView
          name={{
            ios: 'backward.end.fill',
            android: 'skip_previous',
            web: 'skip_previous',
          }}
          size={18}
          tintColor="#C62828"
        />
        <Text style={styles.fromStartLabel}>From start</Text>
      </Pressable>

      <IconButton
        icon={{
          ios: isRecording ? 'stop.fill' : 'mic.fill',
          android: isRecording ? 'stop' : 'mic',
          web: isRecording ? 'stop' : 'mic',
        }}
        variant="primary"
        size={28}
        disabled={isRecording ? false : disabled}
        onPressIn={
          isRecording
            ? () => {
                // Freeze the take in this press, before any studio follow-up JS.
                recordingSessionService.requestStop();
                onStop();
              }
            : undefined
        }
        onPress={isRecording ? undefined : onRecord}
      />

      <IconButton
        icon={{
          ios: isPaused ? 'play.fill' : 'pause.fill',
          android: isPaused ? 'play_arrow' : 'pause',
          web: isPaused ? 'play_arrow' : 'pause',
        }}
        disabled={disabled || !isRecording}
        onPress={onPauseResume}
      />

      <Text style={styles.hint}>
        {isRecording
          ? 'Recording — headphones recommended'
          : 'Rec starts at the playhead. Rec from start overwrites from 00:00.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
    paddingVertical: 8,
  },
  fromStart: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minWidth: 56,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  fromStartDisabled: {
    opacity: 0.4,
  },
  fromStartPressed: {
    opacity: 0.75,
  },
  fromStartLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#C62828',
  },
  hint: {
    width: '100%',
    textAlign: 'center',
    fontSize: 11,
    color: '#7A7F87',
  },
});
