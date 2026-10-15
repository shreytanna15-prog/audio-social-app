import { Portal } from '@rn-primitives/portal';
import { X } from 'lucide-react-native';
import * as React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/shared/components/ui/text';
import { cn } from '@/shared/lib/utils';

const OPEN_MS = 240;
const CLOSE_MS = 200;
const OPEN_EASING = Easing.out(Easing.cubic);
const CLOSE_EASING = Easing.in(Easing.cubic);
const DEFAULT_SHEET_HEIGHT = 420;

type SheetContextValue = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const SheetContext = React.createContext<SheetContextValue | null>(null);

function useSheetContext() {
  const ctx = React.useContext(SheetContext);
  if (!ctx) {
    throw new Error('Sheet components must be used within <Sheet>.');
  }
  return ctx;
}

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

function Sheet({ open, onOpenChange, children }: SheetProps) {
  const value = React.useMemo(() => ({ open, onOpenChange }), [open, onOpenChange]);
  return <SheetContext.Provider value={value}>{children}</SheetContext.Provider>;
}

type SheetContentProps = {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  /**
   * Extra space under the sheet so chrome below (e.g. tab bar) stays visible.
   * Defaults to the bottom safe-area inset.
   */
  bottomOffset?: number;
  showHandle?: boolean;
  /** Use RN Modal (covers everything). Prefer false when keeping a tab bar interactive. */
  useModal?: boolean;
};

function SheetContent({
  children,
  className,
  style,
  bottomOffset,
  showHandle = true,
  useModal = false,
}: SheetContentProps) {
  // Portal/Modal render outside the original tree — re-provide context there.
  const sheet = useSheetContext();
  const insets = useSafeAreaInsets();
  const portalName = React.useId();
  const resolvedBottomOffset = bottomOffset ?? Math.max(insets.bottom, 8);

  const [mounted, setMounted] = React.useState(sheet.open);
  const progress = useSharedValue(sheet.open ? 1 : 0);
  const sheetHeight = useSharedValue(DEFAULT_SHEET_HEIGHT);
  const hasMeasuredRef = React.useRef(sheet.open);
  const pendingOpenRef = React.useRef(false);

  const animateOpen = React.useCallback(() => {
    progress.set(withTiming(1, { duration: OPEN_MS, easing: OPEN_EASING }));
  }, [progress]);

  React.useEffect(() => {
    if (sheet.open) {
      setMounted(true);
      if (hasMeasuredRef.current) {
        animateOpen();
      } else {
        // Wait for first layout so translate distance matches real height.
        pendingOpenRef.current = true;
        progress.set(0);
      }
      return;
    }

    pendingOpenRef.current = false;

    if (!mounted) {
      return;
    }

    progress.set(
      withTiming(0, { duration: CLOSE_MS, easing: CLOSE_EASING }, (finished) => {
        if (finished) {
          runOnJS(setMounted)(false);
        }
      }),
    );
  }, [animateOpen, mounted, progress, sheet.open]);

  const onPanelLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      const next = event.nativeEvent.layout.height;
      if (next <= 0) {
        return;
      }

      sheetHeight.set(next);
      hasMeasuredRef.current = true;

      if (pendingOpenRef.current) {
        pendingOpenRef.current = false;
        animateOpen();
      }
    },
    [animateOpen, sheetHeight],
  );

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
  }));

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.get()) * sheetHeight.get() }],
  }));

  const body = mounted ? (
    <SheetContext.Provider value={sheet}>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Animated.View
          pointerEvents="box-none"
          style={[StyleSheet.absoluteFill, overlayStyle]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            onPress={() => sheet.onOpenChange(false)}
            className="bg-black/55"
            style={[StyleSheet.absoluteFill, { bottom: resolvedBottomOffset }]}
          />
        </Animated.View>

        <View
          pointerEvents="box-none"
          style={[styles.sheetAnchor, { paddingBottom: resolvedBottomOffset }]}>
          <Animated.View
            onLayout={onPanelLayout}
            className={cn(
              'overflow-hidden rounded-t-[28px] border border-white/10 bg-surface-container-low px-5 pb-5 pt-3',
              className,
            )}
            style={[style, panelStyle]}>
            {showHandle ? <SheetHandle /> : null}
            {children}
          </Animated.View>
        </View>
      </View>
    </SheetContext.Provider>
  ) : null;

  if (useModal) {
    return (
      <Modal
        visible={mounted}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => sheet.onOpenChange(false)}>
        {body}
      </Modal>
    );
  }

  return <Portal name={portalName}>{body}</Portal>;
}

function SheetHandle({ className }: { className?: string }) {
  return (
    <View className={cn('mb-3 items-center', className)}>
      <View className="h-1 w-10 rounded-full bg-white/20" />
    </View>
  );
}

type SheetHeaderProps = {
  children: React.ReactNode;
  className?: string;
};

function SheetHeader({ children, className }: SheetHeaderProps) {
  return <View className={cn('mb-5 gap-1 pr-12', className)}>{children}</View>;
}

type SheetTitleProps = {
  children: React.ReactNode;
  className?: string;
};

function SheetTitle({ children, className }: SheetTitleProps) {
  return (
    <Text variant="headline-md" className={cn('text-on-surface', className)}>
      {children}
    </Text>
  );
}

type SheetDescriptionProps = {
  children: React.ReactNode;
  className?: string;
};

function SheetDescription({ children, className }: SheetDescriptionProps) {
  return (
    <Text variant="body-md" className={cn('text-on-surface-variant', className)}>
      {children}
    </Text>
  );
}

type SheetCloseProps = {
  className?: string;
  accessibilityLabel?: string;
};

function SheetClose({ className, accessibilityLabel = 'Close' }: SheetCloseProps) {
  const { onOpenChange } = useSheetContext();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() => onOpenChange(false)}
      className={cn(
        'absolute right-4 top-3 h-9 w-9 items-center justify-center rounded-full bg-surface-container-highest',
        className,
      )}
      hitSlop={8}>
      <X size={18} color="#E4E1EA" strokeWidth={2.2} />
    </Pressable>
  );
}

type SheetBodyProps = {
  children: React.ReactNode;
  className?: string;
};

function SheetBody({ children, className }: SheetBodyProps) {
  return <View className={cn('gap-3', className)}>{children}</View>;
}

const styles = StyleSheet.create({
  sheetAnchor: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'flex-end',
  },
});

export {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHandle,
  SheetHeader,
  SheetTitle,
  useSheetContext,
};
export type { SheetContentProps, SheetProps };
