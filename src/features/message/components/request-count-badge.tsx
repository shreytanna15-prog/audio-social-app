import { View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

/** Figma requests count pill (`#A078FF` / `#3C0091`, 18×17, rx 8.5). */
const BADGE_BG = '#A078FF';
const BADGE_FG = '#3C0091';
const BADGE_HEIGHT = 17;
const BADGE_MIN_WIDTH = 18;
const BADGE_RADIUS = 8.5;

type RequestCountBadgeProps = {
  count: number;
};

export function RequestCountBadge({ count }: RequestCountBadgeProps) {
  if (count <= 0) return null;

  const label = count > 99 ? '99+' : String(count);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      className="items-center justify-center"
      style={{
        minWidth: BADGE_MIN_WIDTH,
        height: BADGE_HEIGHT,
        paddingHorizontal: label.length > 1 ? 5 : 0,
        borderRadius: BADGE_RADIUS,
        borderCurve: 'continuous',
        backgroundColor: BADGE_BG,
      }}>
      <Text
        style={{
          color: BADGE_FG,
          fontSize: 11,
          lineHeight: 13,
          fontWeight: '700',
          letterSpacing: 0,
          includeFontPadding: false,
          textAlign: 'center',
        }}>
        {label}
      </Text>
    </View>
  );
}
