import { Pressable, View } from 'react-native';

import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Text } from '@/shared/components/ui/text';

type TrackActionsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Take audio already lives in the cloud. */
  synced: boolean;
  published: boolean;
  /** False when the local audio is missing, so backup cannot run. */
  canBackup: boolean;
  isBackingUp?: boolean;
  onBackup: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
};

/** Track card menu: cloud + publish actions on top, quiet delete/cancel below. */
export function TrackActionsDialog({
  open,
  onOpenChange,
  title,
  synced,
  published,
  canBackup,
  isBackingUp = false,
  onBackup,
  onPublish,
  onUnpublish,
  onDelete,
}: TrackActionsDialogProps) {
  const backupDisabled = !canBackup || synced || isBackingUp;
  const publishDisabled = !published && (!synced || isBackingUp);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dismissOnBackdropPress={!isBackingUp}>
        <DialogHeader>
          <DialogTitle className="text-[18px]">{title}</DialogTitle>
        </DialogHeader>

        <View className="flex-row gap-3">
          <Button
            variant="secondary"
            size="sm"
            className="min-w-0 flex-1 items-center justify-center"
            disabled={backupDisabled}
            onPress={onBackup}>
            <Text numberOfLines={1}>
              {synced
                ? 'Synced to cloud'
                : isBackingUp
                  ? 'Uploading…'
                  : 'Back up to cloud'}
            </Text>
          </Button>
          <Button
            variant="soft"
            size="sm"
            className="min-w-0 flex-1 items-center justify-center"
            disabled={publishDisabled}
            onPress={published ? onUnpublish : onPublish}>
            <Text numberOfLines={1}>
              {published ? 'Unpublish' : 'Publish'}
            </Text>
          </Button>
        </View>

        {!synced && !published ? (
          <Text variant="caption" className="text-on-surface-variant">
            {isBackingUp
              ? 'Uploading this take to the cloud…'
              : 'Back up to cloud first to publish.'}
          </Text>
        ) : null}

        <View className="mt-1 flex-row items-center justify-between border-t border-white/10 pt-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete track"
            disabled={isBackingUp}
            hitSlop={8}
            onPress={onDelete}>
            <Text variant="label-md" className="text-error">
              Delete track
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            hitSlop={8}
            onPress={() => onOpenChange(false)}>
            <Text variant="label-md" className="text-on-surface-variant">
              Cancel
            </Text>
          </Pressable>
        </View>
      </DialogContent>
    </Dialog>
  );
}
