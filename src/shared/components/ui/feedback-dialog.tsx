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
  onPress?: () => void | Promise<void>;
  /** @default 'ghost' for secondary, 'soft' for primary when only one / last */
  variant?: 'ghost' | 'soft' | 'tonal' | 'destructive';
  /** Keep dialog open and let onPress manage dismiss (async confirms). */
  closeOnPress?: boolean;
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
  isPending?: boolean;
};

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    value != null &&
    typeof value === 'object' &&
    typeof (value as PromiseLike<unknown>).then === 'function'
  );
}

/**
 * App-styled alert / confirm — prefer this over `Alert.alert`.
 */
export function FeedbackDialog({
  feedback,
  onOpenChange,
  isPending = false,
}: FeedbackDialogProps) {
  const actions: FeedbackAction[] =
    feedback?.actions && feedback.actions.length > 0
      ? feedback.actions
      : [{ label: 'OK', variant: 'soft' }];

  // 3+ actions = action sheet (stack). 1–2 = alert/confirm (row).
  const stacked = actions.length > 2;

  return (
    <Dialog
      open={feedback != null}
      onOpenChange={(open) => {
        if (isPending && !open) return;
        onOpenChange(open);
      }}>
      <DialogContent dismissOnBackdropPress={!isPending}>
        <DialogHeader>
          <DialogTitle>{feedback?.title ?? ''}</DialogTitle>
        </DialogHeader>
        {feedback?.message ? (
          <DialogDescription>{feedback.message}</DialogDescription>
        ) : null}
        <DialogFooter
          className={
            stacked ? 'mt-1 flex-col items-stretch gap-2' : undefined
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
                disabled={isPending}
                onPress={() => {
                  if (isPending) return;
                  if (action.closeOnPress === false) {
                    void action.onPress?.();
                    return;
                  }
                  // Close first so chained show()/confirm() are not wiped.
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
  const [isPending, setIsPending] = useState(false);

  const show = useCallback((content: FeedbackContent) => {
    setIsPending(false);
    setFeedback(content);
  }, []);

  const showError = useCallback((title: string, message: string) => {
    setIsPending(false);
    setFeedback({ title, message });
  }, []);

  const dismiss = useCallback(() => {
    setIsPending(false);
    setFeedback(null);
  }, []);

  /** Non-dismissible busy dialog while `work` runs (e.g. cloud download). */
  const runBusy = useCallback(
    async (
      title: string,
      message: string,
      work: () => Promise<void>,
      options?: { busyLabel?: string },
    ) => {
      const busyLabel = options?.busyLabel ?? 'Working…';
      setIsPending(true);
      setFeedback({
        title,
        message,
        actions: [
          {
            label: busyLabel,
            variant: 'soft',
            closeOnPress: false,
          },
        ],
      });

      try {
        await work();
        setIsPending(false);
        setFeedback(null);
      } catch (error) {
        setIsPending(false);
        throw error;
      }
    },
    [],
  );

  const confirm = useCallback(
    (
      title: string,
      message: string,
      options?: {
        confirmLabel?: string;
        cancelLabel?: string;
        pendingLabel?: string;
        destructive?: boolean;
        onConfirm?: () => void | Promise<void>;
        onCancel?: () => void;
      },
    ) => {
      const confirmLabel = options?.confirmLabel ?? 'OK';
      const pendingLabel = options?.pendingLabel ?? `${confirmLabel}…`;

      setIsPending(false);
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
            label: confirmLabel,
            variant: options?.destructive ? 'destructive' : 'soft',
            closeOnPress: false,
            onPress: async () => {
              const result = options?.onConfirm?.();
              if (!isThenable(result)) {
                setFeedback(null);
                return;
              }

              setIsPending(true);
              setFeedback((prev) => {
                if (!prev?.actions?.length) return prev;
                const nextActions = [...prev.actions];
                const last = nextActions.length - 1;
                nextActions[last] = {
                  ...nextActions[last],
                  label: pendingLabel,
                };
                return { ...prev, actions: nextActions };
              });

              try {
                await result;
                setIsPending(false);
                setFeedback(null);
              } catch {
                // Caller may have replaced feedback via showError.
                setIsPending(false);
              }
            },
          },
        ],
      });
    },
    [],
  );

  const dialog = useMemo(
    () => (
      <FeedbackDialog
        feedback={feedback}
        isPending={isPending}
        onOpenChange={(open) => {
          if (!open && !isPending) {
            setFeedback(null);
          }
        }}
      />
    ),
    [feedback, isPending],
  );

  return {
    feedback,
    show,
    showError,
    confirm,
    runBusy,
    dismiss,
    dialog,
    isPending,
  };
}
