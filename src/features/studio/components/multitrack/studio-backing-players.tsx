import { useAudioPlayer } from 'expo-audio';
import { useEffect } from 'react';

type BackingPlayerProps = {
  uri: string;
  offsetSeconds: number;
  startAtSeconds: number;
  playing: boolean;
  paused: boolean;
};

/**
 * Monitor-only playback for the other layers while the mic is open. Nothing
 * reads its status, so the update stream is pushed out to keep status events
 * off the thread that is draining the capture buffers.
 */
const MONITOR_UPDATE_MS = 2000;

function BackingPlayer({
  uri,
  offsetSeconds,
  startAtSeconds,
  playing,
  paused,
}: BackingPlayerProps) {
  const player = useAudioPlayer(uri, { updateInterval: MONITOR_UPDATE_MS });

  useEffect(() => {
    if (!playing) {
      player.pause();
      void player.seekTo(0);
      return;
    }

    if (paused) {
      player.pause();
      return;
    }

    const local = startAtSeconds - offsetSeconds;
    if (local < 0) {
      player.pause();
      void player.seekTo(0);
      return;
    }

    void player.seekTo(local).then(() => {
      player.play();
    });
  }, [offsetSeconds, paused, player, playing, startAtSeconds]);

  return null;
}

export type StudioBackingTrack = {
  uri: string;
  offsetSeconds: number;
};

type StudioBackingPlayersProps = {
  tracks: StudioBackingTrack[];
  startAtSeconds: number;
  playing: boolean;
  paused: boolean;
};

export function StudioBackingPlayers({
  tracks,
  startAtSeconds,
  playing,
  paused,
}: StudioBackingPlayersProps) {
  return (
    <>
      {tracks.map((track) => (
        <BackingPlayer
          key={track.uri}
          uri={track.uri}
          offsetSeconds={track.offsetSeconds}
          startAtSeconds={startAtSeconds}
          playing={playing}
          paused={paused}
        />
      ))}
    </>
  );
}
