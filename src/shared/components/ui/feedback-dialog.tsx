import { useCallback, useMemo, useState } from 'react';

import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Text } from '@/shared/components/ui/text';

export type FeedbackAction = {
  label: string;
  onPress?: () => void;
  /** @default 'ghost' for secondary, 'soft' for primary when only one / last */
  variant?: 'ghost' | 'soft' | 'tonal' | 'destructive';
};

export type FeedbackContent = {
  title: string;
  message?: string;
  /** Defaults to a single OK button. */
  actions?: FeedbackAction[];
};

type FeedbackDialogProps = {
  feedback: FeedbackContent | null;
  onOpenChange: (open: boolean) => void;
};

/**
 * App-styled alert / confirm — prefer this over `Alert.alert`.
 */
export function FeedbackDialog({ feedback, onOpenChange }: FeedbackDialogProps) {
  const actions: FeedbackAction[] =
    feedback?.actions && feedback.actions.length > 0
      ? feedback.actions
      : [{ label: 'OK', variant: 'soft' }];

  // 3+ actions = action sheet (stack). 1–2 = alert/confirm (row).
  const stacked = actions.length > 2;

  return (
    <Dialog
      open={feedback != null}
      onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{feedback?.title ?? ''}</DialogTitle>
        </DialogHeader>
        {feedback?.message ? (
          <DialogDescription>{feedback.message}</DialogDescription>
        ) : null}
        <DialogFooter
          className={
            stacked
              ? 'mt-1 flex-col items-stretch gap-2'
              : undefined
          }>
          {actions.map((action, index) => {
            const isLast = index === actions.length - 1;
            const variant =
              action.variant ?? (isLast ? 'soft' : 'ghost');
            return (
              <Button
                key={`${action.label}-${index}`}
                variant={variant}
                size={stacked ? 'default' : 'sm'}
                className={stacked ? 'w-full' : undefined}
                onPress={() => {
                  onOpenChange(false);
                  action.onPress?.();
                }}>
                <Text>{action.label}</Text>
              </Button>
            );
          })}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useFeedbackDialog() {
  const [feedback, setFeedback] = useState<FeedbackContent | null>(null);

  const show = useCallback((content: FeedbackContent) => {
    setFeedback(content);
  }, []);

  const showError = useCallback((title: string, message: string) => {
    setFeedback({ title, message });
  }, []);

  const confirm = useCallback(
    (
      title: string,
      message: string,
      options?: {
        confirmLabel?: string;
        cancelLabel?: string;
        destructive?: boolean;
        onConfirm?: () => void;
        onCancel?: () => void;
      },
    ) => {
      setFeedback({
        title,
        message,
        actions: [
          {
            label: options?.cancelLabel ?? 'Cancel',
            variant: 'ghost',
            onPress: options?.onCancel,
          },
          {
            label: options?.confirmLabel ?? 'OK',
            variant: options?.destructive ? 'destructive' : 'soft',
            onPress: options?.onConfirm,
          },
        ],
      });
    },
    [],
  );

  const dismiss = useCallback(() => setFeedback(null), []);

  const dialog = useMemo(
    () => (
      <FeedbackDialog
        feedback={feedback}
        onOpenChange={(open) => {
          if (!open) setFeedback(null);
        }}
      />
    ),
    [feedback],
  );

  return { feedback, show, showError, confirm, dismiss, dialog };
}
