import type { AppliedEffect, EffectParamValues } from '@/module/audio/types/applied-effects';
import type { AudioEffectId } from '@/module/audio/types/effects';

export type EffectParamSlider = {
  kind: 'slider';
  id: string;
  label: string;
  description?: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit?: string;
  /** Plain-language label shown instead of the raw number (e.g. 3 → "Medium"). */
  valueLabels?: Record<number, string>;
};

export type EffectParamSelect = {
  kind: 'select';
  id: string;
  label: string;
  description?: string;
  options: { value: string; label: string; description?: string }[];
  defaultValue: string;
};

export type EffectParamDefinition = EffectParamSlider | EffectParamSelect;

export type EffectDefinition = {
  id: AudioEffectId;
  label: string;
  description: string;
  hasSettingsDrawer: boolean;
  params: EffectParamDefinition[];
};

export const EFFECT_DEFINITIONS: Record<AudioEffectId, EffectDefinition> = {
  denoise: {
    id: 'denoise',
    label: 'Denoise',
    description: 'Remove background noise from your recording. Adjust settings, then tap Apply.',
    hasSettingsDrawer: true,
    params: [
      {
        kind: 'slider',
        id: 'strength',
        label: 'Cleanup strength',
        description: 'How much background noise to remove. Start with Medium.',
        min: 1,
        max: 5,
        step: 1,
        defaultValue: 3,
        valueLabels: {
          1: 'Mild',
          2: 'Light',
          3: 'Medium',
          4: 'Strong',
          5: 'Maximum',
        },
      },
      {
        kind: 'select',
        id: 'profile',
        label: 'Background noise type',
        description: 'Pick what best matches where you recorded.',
        defaultValue: 'crowd',
        options: [
          {
            value: 'crowd',
            label: 'Crowd & room',
            description: 'Cafes, streets, general chatter.',
          },
          {
            value: 'voices',
            label: 'People talking',
            description: 'Others speaking near you.',
          },
          {
            value: 'steady',
            label: 'Fan or hum',
            description: 'AC, computer fan, steady buzzing.',
          },
        ],
      },
      {
        kind: 'select',
        id: 'reduceRumble',
        label: 'Cut low rumble',
        description: 'Removes traffic, wind, and deep background noise.',
        defaultValue: 'on',
        options: [
          { value: 'on', label: 'On (recommended)' },
          { value: 'off', label: 'Off' },
        ],
      },
      {
        kind: 'select',
        id: 'reduceHiss',
        label: 'Reduce hiss',
        description: 'Softens harsh high-frequency noise after cleanup.',
        defaultValue: 'on',
        options: [
          { value: 'on', label: 'On (recommended)' },
          { value: 'off', label: 'Off' },
        ],
      },
    ],
  },
  enhance: {
    id: 'enhance',
    label: 'Enhance',
    description: 'Polish vocals with compression, loudness, and clarity.',
    hasSettingsDrawer: false,
    params: [],
  },
  reverb: {
    id: 'reverb',
    label: 'Reverb',
    description: 'Add room ambience and space.',
    hasSettingsDrawer: false,
    params: [],
  },
  echo: {
    id: 'echo',
    label: 'Echo',
    description: 'Add delayed repeats to your voice.',
    hasSettingsDrawer: false,
    params: [],
  },
  modulate: {
    id: 'modulate',
    label: 'Modulate',
    description: 'Wobble and vibrato modulation.',
    hasSettingsDrawer: false,
    params: [],
  },
};

export const EFFECT_APPLICATION_ORDER: AudioEffectId[] = [
  'denoise',
  'reverb',
  'echo',
  'modulate',
  'enhance',
];

export function getEffectDefinition(effectId: AudioEffectId): EffectDefinition {
  return EFFECT_DEFINITIONS[effectId];
}

export function effectHasSettingsDrawer(effectId: AudioEffectId): boolean {
  return EFFECT_DEFINITIONS[effectId].hasSettingsDrawer;
}

export function getDefaultEffectParams(effectId: AudioEffectId): EffectParamValues {
  const definition = getEffectDefinition(effectId);
  const params: EffectParamValues = {};

  for (const param of definition.params) {
    params[param.id] = param.defaultValue;
  }

  return params;
}

export function createAppliedEffect(
  effectId: AudioEffectId,
  params: EffectParamValues = getDefaultEffectParams(effectId),
): AppliedEffect {
  return { id: effectId, params };
}

export function normalizeAppliedEffects(
  effects?: AudioEffectId[] | AppliedEffect[] | string[],
): AppliedEffect[] {
  if (!effects || effects.length === 0) {
    return [];
  }

  const first = effects[0];

  if (typeof first === 'string') {
    return (effects as AudioEffectId[]).map((id) => createAppliedEffect(id));
  }

  return effects as AppliedEffect[];
}
