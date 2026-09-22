import { Text, View } from 'react-native';

export type OnboardingIconName =
  | 'arrow-back'
  | 'arrow-forward'
  | 'play'
  | 'check'
  | 'sparkle'
  | 'music'
  | 'graphic-eq';

type OnboardingIconProps = {
  name: OnboardingIconName;
  size?: number;
  color?: string;
};

export function OnboardingIcon({
  name,
  size = 20,
  color = '#E4E1EA',
}: OnboardingIconProps) {
  switch (name) {
    case 'arrow-back':
      return (
        <Text style={{ fontSize: size, color, lineHeight: size * 1.1 }} accessibilityElementsHidden>
          ←
        </Text>
      );
    case 'arrow-forward':
      return (
        <Text style={{ fontSize: size, color, lineHeight: size * 1.1 }} accessibilityElementsHidden>
          →
        </Text>
      );
    case 'play':
      return <PlayGlyph size={size} color={color} />;
    case 'check':
      return (
        <Text style={{ fontSize: size, color, lineHeight: size * 1.1 }} accessibilityElementsHidden>
          ✓
        </Text>
      );
    case 'sparkle':
      return (
        <Text style={{ fontSize: size, color, lineHeight: size * 1.1 }} accessibilityElementsHidden>
          ✦
        </Text>
      );
    case 'music':
      return (
        <Text style={{ fontSize: size, color, lineHeight: size * 1.1 }} accessibilityElementsHidden>
          ♪
        </Text>
      );
    case 'graphic-eq':
      return <GraphicEq size={size} color={color} />;
  }
}

function PlayGlyph({ size, color }: { size: number; color: string }) {
  const body = Math.round(size * 0.62);
  const head = Math.round(size * 0.92);
  return (
    <View
      accessibilityElementsHidden
      style={{
        width: 0,
        height: 0,
        borderTopWidth: body,
        borderBottomWidth: body,
        borderLeftWidth: head,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        borderLeftColor: color,
      }}
    />
  );
}

function GraphicEq({ size, color }: { size: number; color: string }) {
  const barWidth = Math.max(2, Math.round(size * 0.14));
  const heights = [0.45, 1, 0.55, 0.8, 0.4];
  return (
    <View
      accessibilityElementsHidden
      style={{
        height: size,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Math.max(1, Math.round(size * 0.1)),
      }}>
      {heights.map((ratio, index) => (
        <View
          key={index}
          style={{
            width: barWidth,
            height: Math.max(3, size * ratio),
            borderRadius: barWidth / 2,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  );
}