import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/module/audio/components/icon-button';

type RecorderControlsProps = {
  isRecording: boolean;
  isPaused: boolean;
  canReset: boolean;
  onPauseResume: () => void;
  onMainAction: () => void;
  onReset: () => void;
};

export function RecorderControls({
  isRecording = false,
  isPaused = false,
  canReset = false,
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
        disabled={!isRecording}
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
        onPress={onMainAction}
      />

      <IconButton
        icon={{
          ios: 'arrow.counterclockwise',
          android: 'refresh',
          web: 'refresh',
        }}
        disabled={!canReset}
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
