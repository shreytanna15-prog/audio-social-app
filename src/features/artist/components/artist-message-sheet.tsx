import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useCreateConversationRequest } from '@/features/message/api/hooks';
import { Button } from '@/shared/components/ui/button';
import { fieldClassName } from '@/shared/components/ui/field-styles';
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
import { cn } from '@/shared/lib/utils';

type ArtistMessageSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artistName: string;
  /** Real user UUID — required for live messaging. */
  targetUserId?: string;
  bottomOffset: number;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ArtistMessageSheet({
  open,
  onOpenChange,
  artistName,
  targetUserId,
  bottomOffset,
}: ArtistMessageSheetProps) {
  const { push } = useRouter();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const createRequest = useCreateConversationRequest();
  const canMessage = Boolean(targetUserId && UUID_RE.test(targetUserId));

  const handleClose = (next: boolean) => {
    if (!next) {
      setDraft('');
      setError(null);
    }
    onOpenChange(next);
  };

  const canSend =
    canMessage && draft.trim().length > 0 && !createRequest.isPending;

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed || !canMessage || !targetUserId || createRequest.isPending) {
      return;
    }
    setError(null);

    createRequest.mutate(
      { userId: targetUserId, body: trimmed },
      {
        onSuccess: (result) => {
          setDraft('');
          handleClose(false);
          push(`/message/${result.conversation.id}` as Href);
        },
        onError: (err) => {
          setError(
            err instanceof Error
              ? err.message
              : 'Couldn’t send message request.',
          );
        },
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        useModal
        bottomOffset={bottomOffset}
        className="bg-[#17171D]">
        <SheetClose />
        <SheetHeader className="pr-14">
          <View className="flex-row items-start justify-between gap-3">
            <View className="min-w-0 flex-1 gap-1">
              <SheetTitle>Message {artistName}</SheetTitle>
              <SheetDescription>
                {canMessage
                  ? 'Send a message request. They’ll need to accept before you can chat.'
                  : 'Messaging is available on live artist profiles from search.'}
              </SheetDescription>
            </View>
            {/* Header action stays above the IME — bottom Send is often covered on Android. */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send"
              accessibilityState={{ disabled: !canSend }}
              accessible
              disabled={!canSend}
              onPress={handleSend}
              hitSlop={12}
              className="min-h-11 min-w-14 items-end justify-center pt-1"
              testID="artist-message-send-header"
              style={{ zIndex: 2 }}>
              <Text
                variant="label-md"
                accessible={false}
                className={canSend ? 'text-primary' : 'text-on-surface-variant'}>
                {createRequest.isPending ? 'Sending…' : 'Send'}
              </Text>
            </Pressable>
          </View>
        </SheetHeader>

        <SheetBody>
          <View className="gap-4">
            <Input
              value={draft}
              onChangeText={setDraft}
              placeholder="Write a message…"
              editable={canMessage && !createRequest.isPending}
              testID="artist-message-input"
              accessibilityLabel="Write a message"
              returnKeyType="send"
              blurOnSubmit
              onSubmitEditing={handleSend}
              className={cn(fieldClassName, 'min-h-13')}
            />
            {error ? (
              <Text variant="body-md" className="text-error">
                {error}
              </Text>
            ) : null}
            <Button
              testID="artist-message-send"
              accessibilityLabel="Send request"
              onPress={handleSend}
              disabled={
                !canMessage ||
                draft.trim().length === 0 ||
                createRequest.isPending
              }>
              <Text>
                {createRequest.isPending ? 'Sending…' : 'Send request'}
              </Text>
            </Button>
          </View>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
