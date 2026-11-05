import { View } from 'react-native';

/** Figma active pip: 14×14, `#D0BCFF` fill, 2px `#131319` knockout ring. */
const ACTIVE = '#D0BCFF';
const RING = '#131319';
const SIZE = 14;
const BORDER = 2;

type ActiveStatusPipProps = {
  /** Slight inset so the pip sits on the avatar edge like Figma */
  inset?: number;
};

export function ActiveStatusPip({ inset = 0 }: ActiveStatusPipProps) {
  return (
    <View
      accessibilityLabel="Online"
      style={{
        position: 'absolute',
        right: inset,
        bottom: inset,
        width: SIZE,
        height: SIZE,
        borderRadius: SIZE / 2,
        backgroundColor: ACTIVE,
        borderWidth: BORDER,
        borderColor: RING,
      }}
    />
  );
}
