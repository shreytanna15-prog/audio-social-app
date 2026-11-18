import { ArrowLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';
import { Text } from '@/shared/components/ui/text';

type ScreenHeaderProps = {
  title: ReactNode;
  /** Defaults to router.back() or Home when nothing is underneath. */
  onBack?: () => void;
  backDisabled?: boolean;
  /** Replaces the back control (e.g. Discard on Quick Record capture). */
  left?: ReactNode;
  /** Trailing control; empty spacer keeps side layout balanced when omitted. */
  right?: ReactNode;
  showBorder?: boolean;
  /**
   * `centered` — back + title + right (default stack chrome).
   * `inline` — back + flex title row (Search field, etc.).
   */
  layout?: 'centered' | 'inline';
};

/**
 * Stack / tool screen chrome: back + centered title + optional right.
 * Use AppHeader on tab roots that need the logo.
 */
export function ScreenHeader({
  title,
  onBack,
  backDisabled = false,
  left,
  right,
  showBorder = true,
  layout = 'centered',
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const { back, canGoBack, replace } = useRouter();
  const { guard } = useNavigationGuard();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (canGoBack()) {
      guard(() => back());
      return;
    }
    guard(() => replace('/(tabs)'));
  };

  const backControl = left ?? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={8}
      disabled={backDisabled}
      onPress={handleBack}
      className="h-10 w-10 items-center justify-center rounded-full active:bg-surface-bright"
      style={{ opacity: backDisabled ? 0.4 : 1 }}>
      <ArrowLeft size={20} color="#CBC3D7" strokeWidth={2} />
    </Pressable>
  );

  return (
    <View
      className={
        showBorder
          ? 'border-b border-white/5 px-4'
          : 'border-b border-transparent px-4'
      }
      style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}>
      {layout === 'inline' ? (
        <View className="min-h-12 flex-row items-center gap-3">
          {backControl}
          <View className="min-w-0 flex-1">{title}</View>
          {right}
        </View>
      ) : (
        <View className="relative h-10 justify-center">
          <View className="absolute inset-y-0 left-0 z-10 justify-center">
            {backControl}
          </View>

          <View
            className="items-center justify-center px-12"
            pointerEvents="box-none">
            {typeof title === 'string' ? (
              <Text
                variant="title-md"
                className="text-on-surface"
                numberOfLines={1}>
                {title}
              </Text>
            ) : (
              title
            )}
          </View>

          <View className="absolute inset-y-0 right-0 z-10 min-w-10 items-end justify-center">
            {right ?? <View className="h-10 w-10" />}
          </View>
        </View>
      )}
    </View>
  );
}
