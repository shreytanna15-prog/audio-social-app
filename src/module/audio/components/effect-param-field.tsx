import { Pressable, StyleSheet, Text, View } from 'react-native';

import type {
  EffectParamDefinition,
  EffectParamSegmented,
  EffectParamSelect,
  EffectParamSlider,
} from '@/module/audio/domain/effect-definitions';
import type { EffectParamValue, EffectParamValues } from '@/module/audio/types/applied-effects';

type EffectParamFieldProps = {
  definition: EffectParamDefinition;
  value: EffectParamValue;
  disabled?: boolean;
  onChange: (value: EffectParamValue) => void;
};

function formatSliderValue(definition: EffectParamSlider, value: number): string {
  if (definition.valueLabels?.[value]) {
    return definition.valueLabels[value];
  }

  if (definition.unit === '%') {
    return `${value}%`;
  }

  return String(value);
}

function EffectParamSliderField({
  definition,
  value,
  disabled = false,
  onChange,
}: {
  definition: EffectParamSlider;
  value: EffectParamValue;
  disabled?: boolean;
  onChange: (value: EffectParamValue) => void;
}) {
  const numericValue = Number(value);
  const progress =
    definition.max === definition.min
      ? 0
      : (numericValue - definition.min) / (definition.max - definition.min);

  const decrease = () => {
    onChange(Math.max(definition.min, numericValue - definition.step));
  };

  const increase = () => {
    onChange(Math.min(definition.max, numericValue + definition.step));
  };

  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{definition.label}</Text>
        <Text style={styles.fieldValue}>{formatSliderValue(definition, numericValue)}</Text>
      </View>
      {definition.description ? (
        <Text style={styles.fieldDescription}>{definition.description}</Text>
      ) : null}
      <View style={styles.sliderRow}>
        <Pressable
          disabled={disabled || numericValue <= definition.min}
          onPress={decrease}
          style={[styles.stepButton, disabled && styles.stepButtonDisabled]}>
          <Text style={styles.stepButtonText}>−</Text>
        </Pressable>
        <View style={styles.track}>
          <View style={[styles.trackFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <Pressable
          disabled={disabled || numericValue >= definition.max}
          onPress={increase}
          style={[styles.stepButton, disabled && styles.stepButtonDisabled]}>
          <Text style={styles.stepButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function EffectParamSelectField({
  definition,
  value,
  disabled = false,
  onChange,
}: {
  definition: EffectParamSelect;
  value: EffectParamValue;
  disabled?: boolean;
  onChange: (value: EffectParamValue) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{definition.label}</Text>
      {definition.description ? (
        <Text style={styles.fieldDescription}>{definition.description}</Text>
      ) : null}
      <View style={styles.optionList}>
        {definition.options.map((option) => {
          const isSelected = option.value === value;

          return (
            <Pressable
              key={option.value}
              disabled={disabled}
              onPress={() => onChange(option.value)}
              style={[styles.option, isSelected && styles.optionSelected, disabled && styles.optionDisabled]}>
              <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                {option.label}
              </Text>
              {option.description ? (
                <Text style={[styles.optionDescription, isSelected && styles.optionDescriptionSelected]}>
                  {option.description}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function EffectParamSegmentedField({
  definition,
  value,
  disabled = false,
  onChange,
}: {
  definition: EffectParamSegmented;
  value: EffectParamValue;
  disabled?: boolean;
  onChange: (value: EffectParamValue) => void;
}) {
  const selectedValue = String(value);

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{definition.label}</Text>
      {definition.description ? (
        <Text style={styles.fieldDescription}>{definition.description}</Text>
      ) : null}
      <View style={styles.segmentedRow}>
        {definition.options.map((option) => {
          const isSelected = option.value === selectedValue;

          return (
            <Pressable
              key={option.value}
              disabled={disabled}
              onPress={() => onChange(option.value)}
              style={[
                styles.segment,
                isSelected && styles.segmentSelected,
                disabled && styles.optionDisabled,
              ]}>
              <Text style={[styles.segmentLabel, isSelected && styles.segmentLabelSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function EffectParamField({ definition, value, disabled, onChange }: EffectParamFieldProps) {
  if (definition.kind === 'slider') {
    return (
      <EffectParamSliderField
        definition={definition}
        value={value}
        disabled={disabled}
        onChange={onChange}
      />
    );
  }

  if (definition.kind === 'segmented') {
    return (
      <EffectParamSegmentedField
        definition={definition}
        value={value}
        disabled={disabled}
        onChange={onChange}
      />
    );
  }

  return (
    <EffectParamSelectField
      definition={definition}
      value={value}
      disabled={disabled}
      onChange={onChange}
    />
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  fieldLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1D21',
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A73E8',
  },
  fieldDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#7A7F87',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8EAED',
  },
  stepButtonDisabled: {
    opacity: 0.45,
  },
  stepButtonText: {
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '600',
    color: '#1A1D21',
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E8EAED',
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#1A73E8',
  },
  optionList: {
    gap: 8,
  },
  option: {
    borderWidth: 1,
    borderColor: '#DADCE0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    gap: 4,
  },
  optionSelected: {
    borderColor: '#1A73E8',
    backgroundColor: '#E8F0FE',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1D21',
  },
  optionLabelSelected: {
    color: '#1A73E8',
  },
  optionDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: '#7A7F87',
  },
  optionDescriptionSelected: {
    color: '#4B6CB7',
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#DADCE0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
  },
  segmentSelected: {
    borderColor: '#1A73E8',
    backgroundColor: '#E8F0FE',
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1D21',
  },
  segmentLabelSelected: {
    color: '#1A73E8',
  },
});
