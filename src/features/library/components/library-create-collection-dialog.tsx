import { useState } from 'react';
import { Pressable, View } from 'react-native';

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

const VISIBILITY_OPTIONS: { id: LibraryPlaylistVisibility; label: string }[] = [
  { id: 'private', label: 'Private' },
  { id: 'public', label: 'Public' },
];

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
          <DialogTitle>{kind === 'playlist' ? 'New playlist' : 'New album'}</DialogTitle>
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
          <View className="flex-row items-center gap-2">
            {VISIBILITY_OPTIONS.map((option) => {
              const active = option.id === visibility;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setVisibility(option.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={option.label}
                  className="rounded-full border border-white/10 px-3.5 py-1.5"
                  style={{
                    borderCurve: 'continuous',
                    backgroundColor: active
                      ? 'rgba(160, 120, 255, 0.24)'
                      : 'transparent',
                  }}>
                  <Text
                    variant="label-md"
                    className={
                      active ? 'text-on-surface' : 'text-on-surface-variant'
                    }>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
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
