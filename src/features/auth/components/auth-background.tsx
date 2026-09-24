import { View } from 'react-native';

export function AuthBackground() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <View
        style={{
          position: 'absolute',
          inset: 0,
          experimental_backgroundImage:
            'radial-gradient(circle at 50% 18%, rgba(160, 120, 255, 0.1) 0%, rgba(14, 14, 20, 0) 58%)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: -112,
          left: '50%',
          width: 320,
          height: 320,
          borderRadius: 160,
          transform: [{ translateX: -160 }],
          experimental_backgroundImage:
            'radial-gradient(circle, rgba(160, 120, 255, 0.15) 0%, rgba(160, 120, 255, 0.1) 54%, rgba(160, 120, 255, 0) 100%)',
        }}
      />
    </View>
  );
}