import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useCreateConversationRequest } from '@/features/message/api/hooks';
import { Button } from '@/shared/components/ui/button';
import { textareaClassName } from '@/shared/components/ui/field-styles';
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
import { Textarea } from '@/shared/components/ui/textarea';

type ProfileMessageSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileName: string;
  targetUserId: string;
  bottomOffset: number;
};

export function ProfileMessageSheet({
  open,
  onOpenChange,
  profileName,
  targetUserId,
  bottomOffset,
}: ProfileMessageSheetProps) {
  const { push } = useRouter();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const createRequest = useCreateConversationRequest();

  const handleClose = (next: boolean) => {
    if (!next) {
      setDraft('');
      setError(null);
    }
    onOpenChange(next);
  };

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed || createRequest.isPending) return;
    setError(null);

    createRequest.mutate(
      { userId: targetUserId, body: trimmed },
      {
        onSuccess: (result) => {
          setDraft('');
          handleClose(false);
          if (result.conversation.status === 'ACCEPTED') {
            push(`/message/${result.conversation.id}` as Href);
            return;
          }
          // Request is pending on the recipient side — inbox stays empty until accept.
          push('/(tabs)/chat' as Href);
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
      <SheetContent bottomOffset={bottomOffset} className="bg-[#17171D]">
        <SheetClose />
        <SheetHeader>
          <SheetTitle>Message {profileName}</SheetTitle>
          <SheetDescription>
            Send a message request. They’ll need to accept before you can chat.
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          <View className="gap-4">
            <Textarea
              value={draft}
              onChangeText={setDraft}
              placeholder="Write a message…"
              className={textareaClassName}
              editable={!createRequest.isPending}
            />
            {error ? (
              <Text variant="body-md" className="text-error">
                {error}
              </Text>
            ) : null}
            <Button
              onPress={handleSend}
              disabled={draft.trim().length === 0 || createRequest.isPending}>
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
