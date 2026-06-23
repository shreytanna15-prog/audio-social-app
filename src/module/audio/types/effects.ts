export const AUDIO_EFFECTS = [
  { id: 'enhance', label: 'Enhance', icon: { ios: 'wand.and.stars', android: 'auto_fix_high', web: 'auto_fix_high' } },
  { id: 'denoise', label: 'Denoise', icon: { ios: 'waveform.path.ecg', android: 'graphic_eq', web: 'graphic_eq' } },
  { id: 'reverb', label: 'Reverb', icon: { ios: 'dot.radiowaves.left.and.right', android: 'surround_sound', web: 'surround_sound' } },
  { id: 'echo', label: 'Echo', icon: { ios: 'repeat', android: 'repeat', web: 'repeat' } },
  { id: 'modulate', label: 'Modulate', icon: { ios: 'slider.horizontal.3', android: 'tune', web: 'tune' } },
] as const;

export type AudioEffectId = (typeof AUDIO_EFFECTS)[number]['id'];
