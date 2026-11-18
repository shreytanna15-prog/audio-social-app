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

import type { LibraryPlaylistVisibility } from '../types';

type LibraryCreateCollectionDialogProps = {
  kind: 'playlist' | 'album';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending?: boolean;
  onSubmit: (input: {
    title: string;
    visibility: LibraryPlaylistVisibility;
  }) => void;
};

export function LibraryCreateCollectionDialog({
  kind,
  open,
  onOpenChange,
  isPending = false,
  onSubmit,
}: LibraryCreateCollectionDialogProps) {
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] =
    useState<LibraryPlaylistVisibility>('private');

  const label = kind === 'playlist' ? 'playlist' : 'album';
  const isPublic = visibility === 'public';

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setTitle('');
      setVisibility('private');
    }
    onOpenChange(next);
  };

  const submit = () => {
    onSubmit({ title: title.trim(), visibility });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent dismissOnBackdropPress={!isPending}>
        <DialogHeader>
          <DialogTitle>
            {kind === 'playlist' ? 'New playlist' : 'New album'}
          </DialogTitle>
        </DialogHeader>
        <Input
          value={title}
          onChangeText={setTitle}
          placeholder={`Name your ${label}`}
          autoFocus
          maxLength={100}
          editable={!isPending}
          returnKeyType="done"
          onSubmitEditing={submit}
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
            onPress={() => handleOpenChange(false)}>
            <Text>Cancel</Text>
          </Button>
          <Button
            variant="soft"
            size="sm"
            disabled={isPending}
            onPress={submit}>
            <Text>{isPending ? 'Creating…' : 'Create'}</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
