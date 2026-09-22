import { View } from 'react-native';

export function OnboardingProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-full bg-surface-container-low/80 px-3 py-1.5">
      {[1, 2, 3].map((n) => (
        <View
          key={n}
          className={`h-1.5 rounded-full ${
            n === step ? 'w-6 bg-primary-tonal' : 'w-1.5 bg-surface-bright'
          }`}
        />
      ))}
    </View>
  );
}