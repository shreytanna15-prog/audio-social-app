import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { useTracks } from '@/features/tracks';
import { Button } from '@/shared/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet';
import { Text } from '@/shared/components/ui/text';

type ProjectAttachTracksSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attachedTrackIds: Set<string>;
  bottomOffset?: number;
  isSubmitting?: boolean;
  onAttach: (trackIds: string[]) => void;
};

export function ProjectAttachTracksSheet({
  open,
  onOpenChange,
  attachedTrackIds,
  bottomOffset = 12,
  isSubmitting = false,
  onAttach,
}: ProjectAttachTracksSheetProps) {
  const tracksQuery = useTracks();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const candidates = (tracksQuery.data ?? []).filter(
    (track) => !attachedTrackIds.has(track.id),
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleClose = (next: boolean) => {
    if (!next) {
      setSelected(new Set());
    }
    onOpenChange(next);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent bottomOffset={bottomOffset} className="bg-[#17171D]">
        <SheetClose />
        <SheetHeader>
          <SheetTitle>Add existing tracks</SheetTitle>
          <SheetDescription>
            Select takes from your library to attach to this project.
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          {tracksQuery.isLoading ? (
            <View className="items-center py-10">
              <ActivityIndicator color="#D0BCFF" />
            </View>
          ) : candidates.length === 0 ? (
            <View className="gap-2 py-8">
              <Text variant="title-md" className="text-on-surface">
                No tracks to add
              </Text>
              <Text variant="body-md" className="text-on-surface-variant">
                All of your takes are already in this project, or your library is
                empty.
              </Text>
            </View>
          ) : (
            <ScrollView className="max-h-80" showsVerticalScrollIndicator={false}>
              <View className="gap-1 pb-3">
                {candidates.map((track) => {
                  const isSelected = selected.has(track.id);
                  return (
                    <Pressable
                      key={track.id}
                      onPress={() => toggle(track.id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isSelected }}
                      className="flex-row items-center gap-3 rounded-xl px-2 py-3.5 active:bg-white/5">
                      <View
                        className={`h-5 w-5 items-center justify-center rounded-md border ${
                          isSelected
                            ? 'border-primary bg-primary'
                            : 'border-white/20 bg-transparent'
                        }`}>
                        {isSelected ? (
                          <Text className="text-[11px] font-bold text-on-primary">
                            ✓
                          </Text>
                        ) : null}
                      </View>
                      <View className="min-w-0 flex-1 gap-0.5">
                        <Text
                          variant="title-md"
                          className="text-on-surface"
                          numberOfLines={1}>
                          {track.title}
                        </Text>
                        <Text
                          variant="caption"
                          className="text-on-surface-variant"
                          numberOfLines={1}>
                          {track.kind} · {track.status}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          )}

          <Button
            variant="soft"
            disabled={selected.size === 0 || isSubmitting}
            onPress={() => onAttach([...selected])}>
            <Text>
              {isSubmitting
                ? 'Adding…'
                : selected.size === 0
                  ? 'Add tracks'
                  : `Add ${selected.size} track${selected.size === 1 ? '' : 's'}`}
            </Text>
          </Button>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
