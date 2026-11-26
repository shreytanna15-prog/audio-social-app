import { Check, CloudUpload, Globe, Trash2 } from 'lucide-react-native';

import { ActionsDialog } from '@/shared/components/ui/actions-dialog';

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
  isUnpublishing?: boolean;
  onBackup: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
};

/** Library track ⋮ menu — domain props mapped onto shared ActionsDialog sheet. */
export function TrackActionsDialog({
  open,
  onOpenChange,
  title,
  synced,
  published,
  canBackup,
  isBackingUp = false,
  isUnpublishing = false,
  onBackup,
  onPublish,
  onUnpublish,
  onDelete,
}: TrackActionsDialogProps) {
  const busy = isBackingUp || isUnpublishing;

  return (
    <ActionsDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="menu"
      title={title}
      busy={busy}
      message={
        !synced && !published
          ? isBackingUp
            ? 'Uploading this take to the cloud…'
            : 'Back up to cloud first to publish.'
          : undefined
      }
      actions={[
        {
          key: 'backup',
          label: synced
            ? 'Synced to cloud'
            : isBackingUp
              ? 'Uploading…'
              : 'Back up to cloud',
          icon: synced ? Check : CloudUpload,
          disabled: !canBackup || synced || busy,
          onPress: onBackup,
        },
        {
          key: 'publish',
          label: isUnpublishing
            ? 'Unpublishing…'
            : published
              ? 'Unpublish'
              : 'Publish',
          icon: Globe,
          disabled: busy || (!published && !synced),
          onPress: published ? onUnpublish : onPublish,
        },
      ]}
      destructiveAction={{
        label: 'Delete track',
        icon: Trash2,
        onPress: onDelete,
        disabled: busy,
      }}
    />
  );
}
