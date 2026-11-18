import { useState } from 'react';
import { Switch, View } from 'react-native';

import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Text } from '@/shared/components/ui/text';
import { Textarea } from '@/shared/components/ui/textarea';

import type { LibraryPlaylistVisibility } from '../types';

export type CollectionEditValues = {
  title: string;
  description: string;
  visibility?: LibraryPlaylistVisibility;
};

type CollectionEditDialogProps = {
  kind: 'playlist' | 'album';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: CollectionEditValues;
  isPending?: boolean;
  onSubmit: (values: CollectionEditValues) => void;
};

/** Mount with a `key` that changes per open so fields reset from `initial`. */
export function CollectionEditDialog({
  kind,
  open,
  onOpenChange,
  initial,
  isPending = false,
  onSubmit,
}: CollectionEditDialogProps) {
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [visibility, setVisibility] = useState<LibraryPlaylistVisibility>(
    initial.visibility ?? 'private',
  );
  const isPublic = visibility === 'public';

  const submit = () => {
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      visibility: kind === 'playlist' ? visibility : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dismissOnBackdropPress={!isPending}>
        <DialogHeader>
          <DialogTitle>
            {kind === 'playlist' ? 'Edit playlist' : 'Edit album'}
          </DialogTitle>
        </DialogHeader>
        <Input
          value={title}
          onChangeText={setTitle}
          placeholder="Title"
          maxLength={100}
          editable={!isPending}
        />
        <Textarea
          value={description}
          onChangeText={setDescription}
          placeholder="Description (optional)"
          maxLength={500}
          numberOfLines={3}
          editable={!isPending}
        />
        {kind === 'playlist' ? (
          <View className="flex-row items-center gap-3 py-0.5">
            <View className="min-w-0 flex-1 gap-0.5">
              <Text variant="label-md" className="text-on-surface">
                Public playlist
              </Text>
              <Text variant="caption" className="text-on-surface-variant">
                {isPublic
                  ? 'Anyone can find and play it.'
                  : 'Only you can see this playlist.'}
              </Text>
            </View>
            <Switch
              value={isPublic}
              disabled={isPending}
              onValueChange={(next) =>
                setVisibility(next ? 'public' : 'private')
              }
              trackColor={{
                false: 'rgba(255,255,255,0.12)',
                true: 'rgba(160,120,255,0.55)',
              }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Public playlist"
            />
          </View>
        ) : null}
        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onPress={() => onOpenChange(false)}>
            <Text>Cancel</Text>
          </Button>
          <Button
            variant="soft"
            size="sm"
            disabled={isPending}
            onPress={submit}>
            <Text>{isPending ? 'Saving…' : 'Save'}</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
