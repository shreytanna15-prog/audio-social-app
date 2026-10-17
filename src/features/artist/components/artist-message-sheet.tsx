import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
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

type ArtistMessageSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artistName: string;
  bottomOffset: number;
};

/**
 * Local-only compose UI until messaging APIs exist.
 * Sends update local confirmation state — no network call.
 */
export function ArtistMessageSheet({
  open,
  onOpenChange,
  artistName,
  bottomOffset,
}: ArtistMessageSheetProps) {
  const [draft, setDraft] = useState('');
  const [sent, setSent] = useState(false);

  const handleClose = (next: boolean) => {
    if (!next) {
      setDraft('');
      setSent(false);
    }
    onOpenChange(next);
  };

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setSent(true);
    setDraft('');
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent bottomOffset={bottomOffset} className="bg-[#17171D]">
        <SheetClose />
        <SheetHeader>
          <SheetTitle>Message {artistName}</SheetTitle>
          <SheetDescription>
            {sent
              ? 'Message saved locally. Backend messaging is not wired yet.'
              : 'Compose a note. This stays on-device until messaging ships.'}
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          {sent ? (
            <View className="gap-4">
              <Text variant="body-md" className="text-on-surface-variant">
                Your message to {artistName} was queued locally.
              </Text>
              <Button variant="secondary" onPress={() => handleClose(false)}>
                <Text>Done</Text>
              </Button>
            </View>
          ) : (
            <View className="gap-4">
              <Input
                value={draft}
                onChangeText={setDraft}
                placeholder="Write a message…"
                multiline
                className="min-h-28"
                textAlignVertical="top"
              />
              <Button onPress={handleSend} disabled={draft.trim().length === 0}>
                <Text>Send</Text>
              </Button>
            </View>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
