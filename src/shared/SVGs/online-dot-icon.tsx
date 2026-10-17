import { View, type ViewProps } from 'react-native';

/**
 * Figma artist-profile online status dot.
 * 36×36 hit/glow box · #A078FF 16 ring · #3C0091 6 core · dark outline + violet glow.
 * (View composition — RN SVG filters from the Figma export are unreliable.)
 */
export function OnlineDotIcon({ style, ...props }: ViewProps) {
  return (
    <View
      {...props}
      style={[{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }, style]}>
      {/* Dark outline (Figma feMorphology dilate 2 → #1B1B21) */}
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: '#1B1B21',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 10px rgba(160, 120, 255, 0.8)',
        }}>
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: '#A078FF',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#3C0091',
            }}
          />
        </View>
      </View>
    </View>
  );
}
