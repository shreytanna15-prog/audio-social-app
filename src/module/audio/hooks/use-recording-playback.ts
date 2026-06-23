import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useCallback } from 'react';

export function useRecordingPlayback(uri: string) {
  const player = useAudioPlayer(uri);
  const playerStatus = useAudioPlayerStatus(player);

  const pause = useCallback(() => {
    player.pause();
  }, [player]);

  const togglePlayback = useCallback(() => {
    if (playerStatus.playing) {
      player.pause();
      return;
    }

    player.seekTo(0);
    player.play();
  }, [player, playerStatus.playing]);

  return {
    isPlaying: playerStatus.playing,
    pause,
    togglePlayback,
  };
}
