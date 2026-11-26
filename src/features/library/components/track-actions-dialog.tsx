import {
  Check,
  Clapperboard,
  CloudUpload,
  Globe,
  Pencil,
  Trash2,
} from 'lucide-react-native';

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
  hasFeedClip?: boolean;
  isBackingUp?: boolean;
  isUnpublishing?: boolean;
  isRemovingFeedClip?: boolean;
  onBackup: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onCreateFeedClip?: () => void;
  onEditFeedClip?: () => void;
  onRemoveFeedClip?: () => void;
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
  hasFeedClip = false,
  isBackingUp = false,
  isUnpublishing = false,
  isRemovingFeedClip = false,
  onBackup,
  onPublish,
  onUnpublish,
  onCreateFeedClip,
  onEditFeedClip,
  onRemoveFeedClip,
  onDelete,
}: TrackActionsDialogProps) {
  const busy = isBackingUp || isUnpublishing || isRemovingFeedClip;

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
        ...(published && !hasFeedClip && onCreateFeedClip
          ? [
              {
                key: 'feed-clip-create',
                label: 'Create Feed Clip',
                icon: Clapperboard,
                disabled: busy,
                onPress: onCreateFeedClip,
              },
            ]
          : []),
        ...(published && hasFeedClip && onEditFeedClip
          ? [
              {
                key: 'feed-clip-edit',
                label: 'Edit Feed Clip',
                icon: Pencil,
                disabled: busy,
                onPress: onEditFeedClip,
              },
            ]
          : []),
        ...(published && hasFeedClip && onRemoveFeedClip
          ? [
              {
                key: 'feed-clip-remove',
                label: isRemovingFeedClip
                  ? 'Removing…'
                  : 'Remove from Feed',
                icon: Trash2,
                disabled: busy,
                onPress: onRemoveFeedClip,
              },
            ]
          : []),
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
