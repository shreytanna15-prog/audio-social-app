import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/module/audio/components/icon-button';

type RecorderControlsProps = {
  isRecording: boolean;
  isPaused: boolean;
  canReset: boolean;
  disabled?: boolean;
  onPauseResume: () => void;
  onMainAction: () => void;
  onReset: () => void;
};

export function RecorderControls({
  isRecording = false,
  isPaused = false,
  canReset = false,
  disabled = false,
  onPauseResume,
  onMainAction,
  onReset,
}: RecorderControlsProps) {
  return (
    <View style={styles.container}>
      <IconButton
        icon={{
          ios: isPaused ? 'play.fill' : 'pause.fill',
          android: isPaused ? 'play_arrow' : 'pause',
          web: isPaused ? 'play_arrow' : 'pause',
        }}
        disabled={disabled || !isRecording}
        onPress={onPauseResume}
      />

      <IconButton
        icon={{
          ios: isRecording ? 'stop.fill' : 'mic.fill',
          android: isRecording ? 'stop' : 'mic',
          web: isRecording ? 'stop' : 'mic',
        }}
        variant="primary"
        size={28}
        disabled={disabled}
        onPress={onMainAction}
      />

      <IconButton
        icon={{
          ios: 'arrow.counterclockwise',
          android: 'refresh',
          web: 'refresh',
        }}
        disabled={disabled || !canReset}
        onPress={onReset}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 12,
  },
});
