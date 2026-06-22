import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/module/audio/components/icon-button';
import { useAudioSession, useRecordings } from '@/module/audio/context';

export function PreviewActions() {
  const { previewUri, timerSeconds, resetSession } = useAudioSession();
  const { saveRecording, isSaving } = useRecordings();
  const player = useAudioPlayer(previewUri);
  const playerStatus = useAudioPlayerStatus(player);

  const handlePlay = () => {
    if (playerStatus.playing) {
      player.pause();
      return;
    }

    player.seekTo(0);
    player.play();
  };

  const handleSave = async () => {
    if (!previewUri || isSaving) return;

    const sourceUri = previewUri;
    const durationSeconds = timerSeconds;

    player.pause();

    const saved = await saveRecording({
      sourceUri,
      durationSeconds,
    });

    if (saved) {
      await resetSession();
    }
  };

  const handleDiscard = async () => {
    player.pause();
    await resetSession();
  };

  return (
    <View style={styles.container}>
      <View style={styles.actions}>
        <IconButton
          icon={{
            ios: playerStatus.playing ? 'pause.fill' : 'play.fill',
            android: playerStatus.playing ? 'pause' : 'play_arrow',
            web: playerStatus.playing ? 'pause' : 'play_arrow',
          }}
          onPress={handlePlay}
          disabled={isSaving}
        />
        <IconButton
          icon={{
            ios: 'square.and.arrow.down',
            android: 'save',
            web: 'save',
          }}
          variant="primary"
          size={24}
          onPress={handleSave}
          disabled={isSaving}
        />
        <IconButton
          icon={{
            ios: 'xmark',
            android: 'close',
            web: 'close',
          }}
          variant="danger"
          onPress={handleDiscard}
          disabled={isSaving}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingVertical: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
});
