import { Image } from 'expo-image';
import { Camera } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoverCollage } from '@/shared/components/music/cover-collage';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Text } from '@/shared/components/ui/text';
import { Textarea } from '@/shared/components/ui/textarea';

import type { LibraryPlaylistVisibility } from '../types';

const VISIBILITY_OPTIONS: { id: LibraryPlaylistVisibility; label: string }[] = [
  { id: 'private', label: 'Private' },
  { id: 'public', label: 'Public' },
];

export type CollectionEditFormValues = {
  title: string;
  description: string;
  visibility?: LibraryPlaylistVisibility;
};

type CollectionEditFormProps = {
  kind: 'playlist' | 'album';
  initial: CollectionEditFormValues;
  coverUrl: string | null;
  coverFallbackUrls?: string[];
  coverRecyclingKey: string;
  isSaving?: boolean;
  isCoverBusy?: boolean;
  onSave: (values: CollectionEditFormValues) => void;
  onPickCover: () => void;
  onRemoveCover?: () => void;
};

export function CollectionEditForm({
  kind,
  initial,
  coverUrl,
  coverFallbackUrls = [],
  coverRecyclingKey,
  isSaving = false,
  isCoverBusy = false,
  onSave,
  onPickCover,
  onRemoveCover,
}: CollectionEditFormProps) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [visibility, setVisibility] = useState<LibraryPlaylistVisibility>(
    initial.visibility ?? 'private',
  );

  useEffect(() => {
    setTitle(initial.title);
    setDescription(initial.description);
    setVisibility(initial.visibility ?? 'private');
  }, [initial.title, initial.description, initial.visibility]);

  const showCollage = !coverUrl && coverFallbackUrls.length > 0;
  const busy = isSaving || isCoverBusy;

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 88 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="items-center gap-3">
          <Pressable
            onPress={onPickCover}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Change cover"
            className="h-40 w-40 items-center justify-center overflow-hidden rounded-3xl bg-surface-container-highest"
            style={{ borderCurve: 'continuous', opacity: busy ? 0.7 : 1 }}>
            {coverUrl ? (
              <Image
                source={{ uri: coverUrl }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                recyclingKey={coverRecyclingKey}
                transition={160}
              />
            ) : showCollage ? (
              <CoverCollage urls={coverFallbackUrls} recyclingKey={coverRecyclingKey} />
            ) : (
              <View className="items-center gap-2">
                <Camera size={28} color="#CBC3D7" strokeWidth={1.8} />
                <Text variant="label-md" className="text-on-surface-variant">
                  Add cover
                </Text>
              </View>
            )}
            {isCoverBusy ? (
              <View className="absolute inset-0 items-center justify-center bg-black/45">
                <ActivityIndicator color="#D0BCFF" />
              </View>
            ) : null}
          </Pressable>

          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={onPickCover}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Choose cover image">
              <Text variant="label-md" className="text-primary-tonal">
                {coverUrl ? 'Change cover' : 'Choose cover'}
              </Text>
            </Pressable>
            {coverUrl && onRemoveCover ? (
              <Pressable
                onPress={onRemoveCover}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel="Remove cover">
                <Text variant="label-md" className="text-on-surface-variant">
                  Remove
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <Input
          value={title}
          onChangeText={setTitle}
          placeholder="Title"
          maxLength={100}
          editable={!busy}
        />
        <Textarea
          value={description}
          onChangeText={setDescription}
          placeholder="Description (optional)"
          maxLength={500}
          numberOfLines={4}
          editable={!busy}
        />

        {kind === 'playlist' ? (
          <View className="gap-2">
            <Text variant="label-md" className="text-on-surface-variant">
              Visibility
            </Text>
            <View className="flex-row items-center gap-2">
              {VISIBILITY_OPTIONS.map((option) => {
                const active = option.id === visibility;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setVisibility(option.id)}
                    disabled={busy}
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
          </View>
        ) : null}
      </ScrollView>

      <View
        className="border-t border-white/5 px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
        <Button
          variant="soft"
          disabled={busy || !title.trim()}
          onPress={() =>
            onSave({
              title: title.trim(),
              description: description.trim(),
              visibility: kind === 'playlist' ? visibility : undefined,
            })
          }>
          <Text>{isSaving ? 'Saving…' : 'Save'}</Text>
        </Button>
      </View>
    </View>
  );
}
