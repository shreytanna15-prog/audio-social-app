import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

type SettingsSectionProps = {
  title: string;
  children: ReactNode;
};

export function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <View className="gap-2">
      <Text
        variant="label-md"
        className="px-1 uppercase tracking-wide text-on-surface-variant">
        {title}
      </Text>
      <View className="overflow-hidden rounded-2xl border border-white/5 bg-surface-container">
        {children}
      </View>
    </View>
  );
}
