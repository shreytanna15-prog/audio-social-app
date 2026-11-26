import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet';
import { Text } from '@/shared/components/ui/text';
import { cn } from '@/shared/lib/utils';

export type ActionsDialogItem = {
  key: string;
  label: string;
  onPress: () => void;
  icon?: LucideIcon;
  variant?: 'default' | 'soft' | 'secondary' | 'destructive';
  disabled?: boolean;
  detail?: string;
};

export type ActionsDialogDestructive = {
  label: string;
  onPress: () => void;
  icon?: LucideIcon;
  disabled?: boolean;
};

type ActionsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message?: string;
  /**
   * `menu` — bottom sheet with rich icon rows (touch friendly, modern mobile).
   * `confirm` — centered dialog alert for confirmations/decisions.
   * @default 'menu'
   */
  variant?: 'menu' | 'confirm';
  actions?: ActionsDialogItem[];
  destructiveAction?: ActionsDialogDestructive;
  busy?: boolean;
  cancelLabel?: string;
};

const CONFIRM_CARD_STYLE = {
  width: '100%',
  maxWidth: 340,
  paddingHorizontal: 20,
  paddingTop: 20,
  paddingBottom: 16,
  borderRadius: 18,
  gap: 16,
} as const;

/**
 * Universal Action Menu:
 * - `menu`: Bottom Sheet with clean icon list rows.
 * - `confirm`: Centered Dialog for decision prompts.
 */
export function ActionsDialog({
  open,
  onOpenChange,
  title,
  message,
  variant = 'menu',
  actions = [],
  destructiveAction,
  busy = false,
  cancelLabel = 'Cancel',
}: ActionsDialogProps) {
  if (variant === 'confirm') {
    return (
      <ConfirmActionsDialog
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        message={message}
        actions={actions}
        busy={busy}
        cancelLabel={cancelLabel}
      />
    );
  }

  const DestructiveIcon = destructiveAction?.icon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent useModal={true} className="pb-6">
        <SheetHeader className="mb-3 pr-4">
          <SheetTitle className="text-[18px] font-semibold text-on-surface">
            {title}
          </SheetTitle>
          {message ? (
            <SheetDescription className="text-on-surface-variant text-[13px] leading-5">
              {message}
            </SheetDescription>
          ) : null}
        </SheetHeader>

        {/* Action list rows */}
        <View className="divide-y divide-white/5 rounded-2xl bg-surface-container/60 overflow-hidden border border-white/5">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Pressable
                key={action.key}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                disabled={busy || action.disabled}
                onPress={action.onPress}
                className={cn(
                  'flex-row items-center justify-between px-4 py-3.5 active:bg-white/10',
                  (busy || action.disabled) && 'opacity-40',
                )}>
                <View className="flex-row items-center gap-3.5 flex-1 pr-2">
                  {Icon ? (
                    <View className="h-9 w-9 items-center justify-center rounded-xl bg-white/5">
                      <Icon
                        size={18}
                        color={action.variant === 'secondary' ? '#D0BCFF' : '#E4E1EA'}
                      />
                    </View>
                  ) : null}
                  <View className="flex-1 justify-center">
                    <Text
                      className={cn(
                        'text-[15px] font-medium',
                        action.variant === 'secondary' ? 'text-primary' : 'text-on-surface',
                      )}
                      numberOfLines={1}>
                      {action.label}
                    </Text>
                    {action.detail ? (
                      <Text
                        variant="caption"
                        className="text-on-surface-variant/70 text-[12px] mt-0.5"
                        numberOfLines={1}>
                        {action.detail}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <ChevronRight size={16} color="#79747E" />
              </Pressable>
            );
          })}

          {destructiveAction ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={destructiveAction.label}
              disabled={busy || destructiveAction.disabled}
              onPress={destructiveAction.onPress}
              className={cn(
                'flex-row items-center justify-between px-4 py-3.5 active:bg-error/10',
                (busy || destructiveAction.disabled) && 'opacity-40',
              )}>
              <View className="flex-row items-center gap-3.5 flex-1 pr-2">
                {DestructiveIcon ? (
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-error/15">
                    <DestructiveIcon size={18} color="#FFB4AB" />
                  </View>
                ) : null}
                <Text className="text-[15px] font-medium text-error" numberOfLines={1}>
                  {destructiveAction.label}
                </Text>
              </View>

              <ChevronRight size={16} color="#FFB4AB" opacity={0.6} />
            </Pressable>
          ) : null}
        </View>

        {/* Cancel button */}
        <View className="mt-3">
          <Button
            variant="ghost"
            size="default"
            disabled={busy}
            className="h-12 w-full rounded-2xl items-center justify-center bg-surface-container/40 active:bg-surface-container"
            onPress={() => onOpenChange(false)}>
            <Text className="text-[15px] font-medium text-on-surface-variant">
              {cancelLabel}
            </Text>
          </Button>
        </View>
      </SheetContent>
    </Sheet>
  );
}

function ConfirmActionsDialog({
  open,
  onOpenChange,
  title,
  message,
  actions,
  busy,
  cancelLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message?: string;
  actions: ActionsDialogItem[];
  busy: boolean;
  cancelLabel: string;
}) {
  const primaryActions = actions.filter((a) => a.variant !== 'destructive');
  const destructiveActions = actions.filter((a) => a.variant === 'destructive');
  const isSimplePair = actions.length === 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dismissOnBackdropPress={!busy} style={CONFIRM_CARD_STYLE}>
        {/* Header */}
        <DialogHeader className="gap-1.5 text-left">
          <DialogTitle className="text-[17px] font-semibold text-on-surface">
            {title}
          </DialogTitle>
          {message ? (
            <DialogDescription className="text-on-surface-variant leading-5 text-[14px]">
              {message}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        {isSimplePair ? (
          /* Simple 2-button row: Cancel | Action */
          <View className="flex-row gap-3 pt-1">
            <Button
              variant="secondary"
              size="default"
              disabled={busy}
              className="h-11 min-w-0 flex-1 rounded-xl items-center justify-center bg-white/5 active:bg-white/10"
              onPress={() => onOpenChange(false)}>
              <Text className="text-[14px] font-medium text-on-surface-variant">
                {cancelLabel}
              </Text>
            </Button>

            {actions.map((action) => (
              <Button
                key={action.key}
                variant={action.variant === 'destructive' ? 'destructive' : 'default'}
                size="default"
                disabled={busy || action.disabled}
                className="h-11 min-w-0 flex-1 rounded-xl items-center justify-center"
                onPress={action.onPress}>
                <Text className="text-[14px] font-medium" numberOfLines={1}>
                  {action.label}
                </Text>
              </Button>
            ))}
          </View>
        ) : (
          /* Multi-action stack (e.g. Keep tracks / Delete tracks too / Cancel) */
          <View className="gap-2.5 pt-1">
            {primaryActions.map((action) => (
              <Button
                key={action.key}
                variant={action.variant === 'secondary' ? 'secondary' : 'soft'}
                size="default"
                disabled={busy || action.disabled}
                className="h-11 w-full rounded-xl items-center justify-center"
                onPress={action.onPress}>
                <Text className="text-[14px] font-medium" numberOfLines={1}>
                  {action.label}
                </Text>
              </Button>
            ))}

            {destructiveActions.map((action) => (
              <Button
                key={action.key}
                variant="destructive"
                size="default"
                disabled={busy || action.disabled}
                className="h-11 w-full rounded-xl items-center justify-center"
                onPress={action.onPress}>
                <Text className="text-[14px] font-medium" numberOfLines={1}>
                  {action.label}
                </Text>
              </Button>
            ))}

            <Button
              variant="ghost"
              size="default"
              disabled={busy}
              className="h-11 w-full rounded-xl items-center justify-center mt-0.5"
              onPress={() => onOpenChange(false)}>
              <Text className="text-[14px] font-medium text-on-surface-variant">
                {cancelLabel}
              </Text>
            </Button>
          </View>
        )}
      </DialogContent>
    </Dialog>
  );
}
