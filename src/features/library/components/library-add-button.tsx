import { Pressable } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

/**
 * Figma Library add control — sized to match headline-lg-mobile (text-2xl / 24).
 */
type LibraryAddButtonProps = {
  onPress: () => void;
};

const SIZE = 24;

export function LibraryAddButton({ onPress }: LibraryAddButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Add to library"
      hitSlop={10}
      style={{
        width: SIZE,
        height: SIZE,
        borderRadius: 8,
        borderCurve: 'continuous',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      }}>
      <Svg width={SIZE} height={SIZE} viewBox="2 1 40 40" fill="none">
        <Rect x={2} y={1} width={40} height={40} rx={12} fill="#2A2930" />
        <Path
          d="M21.0833 21.9166H15.5833V20.0833H21.0833V14.5833H22.9166V20.0833H28.4166V21.9166H22.9166V27.4166H21.0833V21.9166V21.9166"
          fill="#D0BCFF"
        />
      </Svg>
    </Pressable>
  );
}
