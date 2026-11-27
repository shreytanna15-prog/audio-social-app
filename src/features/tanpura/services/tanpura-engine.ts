import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

import { getTanpuraPreset } from '../data/presets';
import { combinedPlaybackRate } from '../data/pitches';
import type { TanpuraPitchId, TanpuraPresetId } from '../types';

const UPDATE_INTERVAL_MS = 500;

type TanpuraPlaybackOptions = {
  presetId: TanpuraPresetId;
  pitchId: TanpuraPitchId;
  volume: number;
  speed: number;
  fineSemis: number;
};

let player: AudioPlayer | null = null;
let activePresetId: TanpuraPresetId | null = null;
let activePitchId: TanpuraPitchId | null = null;
let activeVolume = 0.7;
let activeSpeed = 1;
let activeFineSemis = 0;
let shouldBePlaying = false;

function ensurePlayer(presetId: TanpuraPresetId): AudioPlayer {
  const source = getTanpuraPreset(presetId).source;
  if (!player) {
    player = createAudioPlayer(source, { updateInterval: UPDATE_INTERVAL_MS });
    player.loop = true;
    player.volume = activeVolume;
    player.muted = false;
    activePresetId = presetId;
    return player;
  }

  if (activePresetId !== presetId) {
    player.replace(source);
    player.loop = true;
    activePresetId = presetId;
  }

  return player;
}

function applyPlaybackParams(
  audio: AudioPlayer,
  options: Pick<
    TanpuraPlaybackOptions,
    'pitchId' | 'volume' | 'speed' | 'fineSemis'
  >,
): void {
  activePitchId = options.pitchId;
  activeSpeed = options.speed;
  activeFineSemis = options.fineSemis;
  activeVolume = Math.min(1, Math.max(0, options.volume));
  // Default shouldCorrectPitch=true keeps pitch fixed; turn off so rate retunes Sa.
  audio.shouldCorrectPitch = false;
  audio.setPlaybackRate(
    combinedPlaybackRate(options.pitchId, options.speed, options.fineSemis),
  );
  audio.volume = activeVolume;
  audio.loop = true;
  audio.muted = false;
}

export function tanpuraConfigure(options: TanpuraPlaybackOptions): void {
  const audio = ensurePlayer(options.presetId);
  applyPlaybackParams(audio, options);
  if (shouldBePlaying && !audio.playing) {
    audio.play();
  }
}

export function tanpuraPlay(options: TanpuraPlaybackOptions): void {
  shouldBePlaying = true;
  tanpuraConfigure(options);
  player?.play();
}

export function tanpuraStop(): void {
  shouldBePlaying = false;
  if (!player) return;
  player.pause();
  void player.seekTo(0).catch(() => undefined);
}

export function tanpuraIsPlaying(): boolean {
  return shouldBePlaying && (player?.playing ?? false);
}

export function tanpuraDispose(): void {
  shouldBePlaying = false;
  activePresetId = null;
  activePitchId = null;
  activeSpeed = 1;
  activeFineSemis = 0;
  if (!player) return;
  try {
    player.pause();
    player.remove();
  } catch {
    // ignore
  }
  player = null;
}
