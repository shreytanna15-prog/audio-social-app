import {
  createAudioPlayer,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  type AudioMetadata,
  type AudioPlayer,
  type AudioStatus,
} from 'expo-audio';

const UPDATE_INTERVAL_MS = 250;
const END_EPSILON_SEC = 0.35;

type ListenAudioCallbacks = {
  onStatus: (status: {
    progress: number;
    currentTime: number;
    duration: number;
    playing: boolean;
  }) => void;
  onEnded: () => void;
};

let player: AudioPlayer | null = null;
let callbacks: ListenAudioCallbacks | null = null;
let modeReady = false;
let activeUrl: string | null = null;
let loadGeneration = 0;
let hadMeaningfulProgress = false;
let lastTime = 0;
let endedForGeneration = -1;
let lockScreenActive = false;

function ensurePlayer(): AudioPlayer {
  if (player) return player;

  player = createAudioPlayer(null, { updateInterval: UPDATE_INTERVAL_MS });
  player.volume = 1;
  player.muted = false;
  player.addListener('playbackStatusUpdate', handleStatus);
  return player;
}

async function ensureAudioMode(): Promise<void> {
  if (modeReady) return;
  try {
    await setIsAudioActiveAsync(true);
    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: false,
      interruptionMode: 'doNotMix',
      shouldPlayInBackground: true,
    });
    modeReady = true;
  } catch (error) {
    console.warn('[listen-player] audio mode failed', error);
  }
}

function toLockScreenMetadata(metadata: {
  title?: string;
  artist?: string;
  artworkUrl?: string | null;
}): AudioMetadata {
  return {
    title: metadata.title?.trim() || undefined,
    artist: metadata.artist?.trim() || undefined,
    artworkUrl: metadata.artworkUrl?.trim() || undefined,
  };
}

function applyLockScreenMetadata(
  audio: AudioPlayer,
  metadata: AudioMetadata,
): void {
  try {
    if (!lockScreenActive) {
      audio.setActiveForLockScreen(true, metadata, {
        showSeekForward: true,
        showSeekBackward: true,
      });
      lockScreenActive = true;
      return;
    }
    audio.updateLockScreenMetadata(metadata);
  } catch (error) {
    console.warn('[listen-player] lock screen metadata failed', error);
  }
}

function clearLockScreen(audio: AudioPlayer | null): void {
  if (!audio || !lockScreenActive) {
    lockScreenActive = false;
    return;
  }
  try {
    audio.clearLockScreenControls();
  } catch {
    // ignore
  }
  lockScreenActive = false;
}

function handleStatus(status: AudioStatus): void {
  const duration = status.duration > 0 ? status.duration : 0;
  const currentTime = Math.max(0, status.currentTime ?? 0);
  const progress =
    duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

  if (currentTime > 1) {
    hadMeaningfulProgress = true;
  }

  callbacks?.onStatus({
    progress,
    currentTime,
    duration,
    playing: status.playing,
  });

  // Native loop owns repeat-one; only surface end for queue advance.
  if (status.loop) {
    lastTime = currentTime;
    return;
  }

  const finishedEvent = status.didJustFinish === true;
  const loopedNearEnd =
    duration > 1 &&
    hadMeaningfulProgress &&
    lastTime >= duration - END_EPSILON_SEC &&
    currentTime < END_EPSILON_SEC;

  lastTime = currentTime;

  if (
    hadMeaningfulProgress &&
    (finishedEvent || loopedNearEnd) &&
    endedForGeneration !== loadGeneration
  ) {
    endedForGeneration = loadGeneration;
    callbacks?.onEnded();
  }
}

export function setListenAudioCallbacks(
  next: ListenAudioCallbacks | null,
): void {
  callbacks = next;
}

export async function listenLoadAndPlay(
  url: string,
  loop: boolean,
  metadata?: {
    title?: string;
    artist?: string;
    artworkUrl?: string | null;
  },
): Promise<void> {
  await ensureAudioMode();
  const audio = ensurePlayer();
  const generation = ++loadGeneration;
  hadMeaningfulProgress = false;
  lastTime = 0;
  endedForGeneration = -1;

  audio.loop = loop;
  audio.volume = 1;
  audio.muted = false;

  if (activeUrl !== url) {
    audio.replace(url);
    activeUrl = url;
  }

  if (metadata) {
    applyLockScreenMetadata(audio, toLockScreenMetadata(metadata));
  }

  void audio
    .seekTo(0)
    .catch(() => undefined)
    .then(() => {
      if (generation !== loadGeneration) return;
      audio.play();
    });
}

export function listenResume(loop: boolean): void {
  const audio = player;
  if (!audio || !activeUrl) return;
  audio.loop = loop;
  audio.play();
}

export function listenPause(): void {
  player?.pause();
}

export function listenSeekRatio(ratio: number, fallbackDurationSec: number): void {
  const audio = player;
  if (!audio) return;
  const duration =
    audio.duration > 0 ? audio.duration : Math.max(0, fallbackDurationSec);
  if (duration <= 0) return;
  const clamped = Math.min(1, Math.max(0, ratio));
  void audio.seekTo(clamped * duration).catch(() => undefined);
}

export function listenSetLoop(loop: boolean): void {
  if (player) player.loop = loop;
}

export function listenUpdateMetadata(metadata: {
  title?: string;
  artist?: string;
  artworkUrl?: string | null;
}): void {
  const audio = player;
  if (!audio) return;
  applyLockScreenMetadata(audio, toLockScreenMetadata(metadata));
}

export function listenStop(): void {
  loadGeneration += 1;
  hadMeaningfulProgress = false;
  lastTime = 0;
  endedForGeneration = -1;
  activeUrl = null;
  clearLockScreen(player);
  if (!player) return;
  player.pause();
  void player.seekTo(0).catch(() => undefined);
}

export function listenRelease(): void {
  listenStop();
  if (!player) return;
  player.remove();
  player = null;
}
