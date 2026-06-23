import type { AudioEffectId } from '@/module/audio/types/effects';

const EFFECT_FILTERS: Record<AudioEffectId, string> = {
  denoise: 'afftdn=nr=18:nf=-25',
  reverb: 'aecho=0.8:0.88:40|120|280:0.4|0.25|0.15',
  echo: 'aecho=0.8:0.9:1000:0.35',
  modulate: 'tremolo=f=6:d=0.45,vibrato=f=5:d=0.35',
  enhance: 'loudnorm=I=-14:TP=-1.5:LRA=11,acompressor=threshold=-18dB:ratio=3:attack=5:release=50,equalizer=f=3000:width_type=o:gain=2',
};

export const EFFECT_APPLICATION_ORDER: AudioEffectId[] = [
  'denoise',
  'reverb',
  'echo',
  'modulate',
  'enhance',
];

export function getAudioEffectFilter(effectId: AudioEffectId): string {
  return EFFECT_FILTERS[effectId];
}

export function getCombinedAudioEffectFilter(effectIds: AudioEffectId[]): string {
  const orderedIds = EFFECT_APPLICATION_ORDER.filter((id) => effectIds.includes(id));
  const filters = orderedIds.map((id) => getAudioEffectFilter(id)).join(',');

  if (!filters) {
    return filters;
  }

  return `${filters},alimiter=limit=0.95:level=false`;
}
