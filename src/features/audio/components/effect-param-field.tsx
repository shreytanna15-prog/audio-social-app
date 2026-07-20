import { useCallback, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import type {
  EffectParamDefinition,
  EffectParamSegmented,
  EffectParamSelect,
  EffectParamSlider,
} from '@/features/audio/domain/effect-definitions';
import type { EffectParamValue } from '@/features/audio/types/applied-effects';

type EffectParamFieldProps = {
  definition: EffectParamDefinition;
  value: EffectParamValue;
  disabled?: boolean;
  onChange: (value: EffectParamValue) => void;
};

const SLIDER_THUMB_SIZE = 22;

function formatSliderValue(definition: EffectParamSlider, value: number): string {
  if (definition.valueLabels?.[value]) {
    return definition.valueLabels[value];
  }

  if (definition.unit === '%') {
    return `${value}%`;
  }

  return String(value);
}

function snapSliderValue(definition: EffectParamSlider, raw: number): number {
  const steps = Math.round((raw - definition.min) / definition.step);
  const snapped = definition.min + steps * definition.step;

  return Math.min(definition.max, Math.max(definition.min, snapped));
}

function positionToValue(
  x: number,
  trackWidth: number,
  definition: EffectParamSlider,
): number {
  if (trackWidth <= 0) {
    return definition.min;
  }

  const ratio = Math.min(1, Math.max(0, x / trackWidth));
  const raw = definition.min + ratio * (definition.max - definition.min);

  return snapSliderValue(definition, raw);
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
  const numericValue = snapSliderValue(definition, Number(value));
  const [trackWidth, setTrackWidth] = useState(0);

  const progress =
    definition.max === definition.min
      ? 0
      : (numericValue - definition.min) / (definition.max - definition.min);

  const thumbOffset = trackWidth > 0 ? progress * Math.max(0, trackWidth - SLIDER_THUMB_SIZE) : 0;

  const setValueFromPosition = useCallback(
    (x: number) => {
      onChange(positionToValue(x, trackWidth, definition));
    },
    [definition, onChange, trackWidth],
  );

  const handleTrackLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  const panGesture = Gesture.Pan()
    .enabled(!disabled && trackWidth > 0)
    .hitSlop({ horizontal: 12, vertical: 20 })
    .onUpdate((event) => {
      setValueFromPosition(event.x);
    });

  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{definition.label}</Text>
        <Text style={styles.fieldValue}>{formatSliderValue(definition, numericValue)}</Text>
      </View>
      {definition.description ? (
        <Text style={styles.fieldDescription}>{definition.description}</Text>
      ) : null}
      <GestureDetector gesture={panGesture}>
        <View style={styles.sliderTrackContainer} onLayout={handleTrackLayout}>
          <Pressable
            disabled={disabled || trackWidth <= 0}
            onPress={(event) => setValueFromPosition(event.nativeEvent.locationX)}
            style={styles.sliderTrackPressable}>
            <View style={styles.track}>
              <View style={[styles.trackFill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
            <View
              pointerEvents="none"
              style={[
                styles.thumb,
                {
                  transform: [{ translateX: thumbOffset }],
                },
              ]}
            />
          </Pressable>
        </View>
      </GestureDetector>
      {definition.min !== definition.max && definition.step === 1 && definition.max - definition.min <= 4 ? (
        <View style={styles.sliderTicks}>
          {Array.from({ length: definition.max - definition.min + 1 }, (_, index) => {
            const tickValue = definition.min + index;
            const isActive = tickValue === numericValue;

            return (
              <Text
                key={tickValue}
                style={[styles.sliderTickLabel, isActive && styles.sliderTickLabelActive]}>
                {definition.valueLabels?.[tickValue] ?? String(tickValue)}
              </Text>
            );
          })}
        </View>
      ) : null}
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
  sliderTrackContainer: {
    paddingVertical: 10,
  },
  sliderTrackPressable: {
    justifyContent: 'center',
    minHeight: SLIDER_THUMB_SIZE,
  },
  track: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#E8EAED',
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#1A73E8',
  },
  thumb: {
    position: 'absolute',
    top: 4,
    left: 0,
    width: SLIDER_THUMB_SIZE,
    height: SLIDER_THUMB_SIZE,
    borderRadius: SLIDER_THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1A73E8',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  sliderTicks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sliderTickLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9AA0A6',
  },
  sliderTickLabelActive: {
    color: '#1A73E8',
    fontWeight: '700',
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
