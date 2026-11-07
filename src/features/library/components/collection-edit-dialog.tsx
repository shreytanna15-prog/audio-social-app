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
import { Textarea } from '@/shared/components/ui/textarea';

import type { LibraryPlaylistVisibility } from '../types';

const VISIBILITY_OPTIONS: { id: LibraryPlaylistVisibility; label: string }[] = [
  { id: 'private', label: 'Private' },
  { id: 'public', label: 'Public' },
];

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
