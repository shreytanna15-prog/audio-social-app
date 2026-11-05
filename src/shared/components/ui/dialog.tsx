import * as React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Text } from '@/shared/components/ui/text';
import { cn } from '@/shared/lib/utils';

type DialogContextValue = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const ctx = React.useContext(DialogContext);
  if (!ctx) {
    throw new Error('Dialog components must be used within <Dialog>.');
  }
  return ctx;
}

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

function Dialog({ open, onOpenChange, children }: DialogProps) {
  const value = React.useMemo(
    () => ({ open, onOpenChange }),
    [open, onOpenChange],
  );
  return (
    <DialogContext.Provider value={value}>{children}</DialogContext.Provider>
  );
}

type DialogContentProps = {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  /** Tap dimmed backdrop to dismiss. @default true */
  dismissOnBackdropPress?: boolean;
};

/**
 * Centered modal card. Shell layout uses StyleSheet — NativeWind className on
 * the Modal root is unreliable on native (host tree is outside the app CSS).
 */
function DialogContent({
  children,
  className,
  style,
  dismissOnBackdropPress = true,
}: DialogContentProps) {
  const { open, onOpenChange } = useDialogContext();

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => onOpenChange(false)}>
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          style={styles.backdrop}
          onPress={() => {
            if (dismissOnBackdropPress) {
              onOpenChange(false);
            }
          }}
        />
        <View pointerEvents="box-none" style={styles.center}>
          <View
            accessibilityViewIsModal
            className={cn(className)}
            style={[styles.card, style]}>
            {children}
          </View>
        </View>
      </View>
    </Modal>
  );
}

type DialogHeaderProps = {
  children: React.ReactNode;
  className?: string;
};

function DialogHeader({ children, className }: DialogHeaderProps) {
  return <View className={cn('gap-1', className)}>{children}</View>;
}

type DialogTitleProps = {
  children: React.ReactNode;
  className?: string;
};

function DialogTitle({ children, className }: DialogTitleProps) {
  return (
    <Text variant="title-md" className={cn('text-on-surface', className)}>
      {children}
    </Text>
  );
}

type DialogDescriptionProps = {
  children: React.ReactNode;
  className?: string;
};

function DialogDescription({ children, className }: DialogDescriptionProps) {
  return (
    <Text variant="body-md" className={cn('text-on-surface-variant', className)}>
      {children}
    </Text>
  );
}

type DialogBodyProps = {
  children: React.ReactNode;
  className?: string;
};

function DialogBody({ children, className }: DialogBodyProps) {
  return <View className={cn('gap-3', className)}>{children}</View>;
}

type DialogFooterProps = {
  children: React.ReactNode;
  className?: string;
};

function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <View className={cn('mt-1 flex-row items-center justify-end gap-2', className)}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  center: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#211F26',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderCurve: 'continuous',
  },
});

export {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  useDialogContext,
};
export type { DialogProps };
