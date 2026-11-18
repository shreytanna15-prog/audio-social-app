import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

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
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

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
  const { guard } = useNavigationGuard();
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

  const canSend = draft.trim().length > 0 && !createRequest.isPending;

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
          // Pending shows in Messages as “Pending”; open the thread to confirm send.
          guard(() => push(`/message/${result.conversation.id}` as Href));
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
              <SheetTitle>Message {profileName}</SheetTitle>
              <SheetDescription>
                Send a message request. They’ll need to accept before you can
                chat.
              </SheetDescription>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send"
              accessibilityState={{ disabled: !canSend }}
              accessible
              disabled={!canSend}
              onPress={handleSend}
              hitSlop={12}
              className="min-h-11 min-w-14 items-end justify-center pt-1"
              testID="profile-message-send-header"
              style={{ zIndex: 2 }}>
              <Text
                variant="label-md"
                accessible={false}
                className={
                  canSend ? 'text-primary' : 'text-on-surface-variant'
                }>
                {createRequest.isPending ? 'Sending…' : 'Send'}
              </Text>
            </Pressable>
          </View>
        </SheetHeader>

        <SheetBody>
          <View className="gap-4">
            <Textarea
              value={draft}
              onChangeText={setDraft}
              placeholder="Write a message…"
              className={textareaClassName}
              editable={!createRequest.isPending}
              accessibilityLabel="Write a message"
            />
            {error ? (
              <Text variant="body-md" className="text-error">
                {error}
              </Text>
            ) : null}
            <Button
              testID="profile-message-send"
              accessibilityLabel="Send request"
              onPress={handleSend}
              disabled={!canSend}>
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
