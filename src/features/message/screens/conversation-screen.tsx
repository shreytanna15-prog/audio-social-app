import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/shared/components/ui/text';

import {
  useConversationMessages,
  useConversations,
  useCurrentUser,
  useSendTextMessage,
  useSendVoiceNote,
} from '../api/hooks';
import { mapChatMessage, mapConversationPreview } from '../api/mappers';
import { ConversationComposer } from '../components/conversation-composer';
import { ConversationHeader } from '../components/conversation-header';
import { MessageBubble } from '../components/message-bubble';
import { useConversationRealtime } from '../hooks/use-conversation-realtime';
import type { ChatMessage } from '../types';

const ACCENT = '#D0BCFF';

/** Android edge-to-edge: prefer screenY overlap; height alone under-reports Gboard. */
function imeOverlapPx(height: number, screenY: number) {
  const screenH = Dimensions.get('screen').height;
  const fromScreenY = Math.max(0, screenH - screenY);
  return Math.max(height, fromScreenY);
}

export function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = Array.isArray(id) ? id[0] : id;
  const { back, canGoBack, replace } = useRouter();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const currentUserQuery = useCurrentUser();
  const conversationsQuery = useConversations();
  const messagesQuery = useConversationMessages(conversationId);
  const sendText = useSendTextMessage(conversationId ?? '');
  const sendVoice = useSendVoiceNote(conversationId ?? '');

  useConversationRealtime(conversationId);

  // Android edge-to-edge often skips window resize; pin the composer dock
  // above the IME like SheetContent's bottom-anchored padding.
  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = Keyboard.addListener(showEvent, (event) => {
      const { height, screenY } = event.endCoordinates;
      setKeyboardHeight(
        Platform.OS === 'android' ? imeOverlapPx(height, screenY) : height,
      );
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  const conversation = useMemo(() => {
    const match = (conversationsQuery.data ?? []).find(
      (item) => item.id === conversationId,
    );
    return match ? mapConversationPreview(match) : null;
  }, [conversationsQuery.data, conversationId]);

  const currentUserId = currentUserQuery.data?.id;
  const messages = useMemo(() => {
    if (!currentUserId || !messagesQuery.data) return [];
    return messagesQuery.data.messages.map((message) =>
      mapChatMessage(message, currentUserId),
    );
  }, [currentUserId, messagesQuery.data]);

  useEffect(() => {
    if (messages.length === 0) return;
    const timer = requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
    return () => cancelAnimationFrame(timer);
  }, [messages.length]);

  const handleBack = () => {
    if (canGoBack()) {
      back();
      return;
    }
    replace('/(tabs)/chat' as Href);
  };

  if (!conversationId) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background px-8">
        <Text variant="title-md" className="text-on-surface">
          Conversation not found
        </Text>
        <Pressable onPress={handleBack} accessibilityRole="button">
          <Text variant="body-md" className="text-primary-tonal">
            Go back to Chat
          </Text>
        </Pressable>
      </View>
    );
  }

  if (
    conversationsQuery.isLoading ||
    messagesQuery.isLoading ||
    currentUserQuery.isLoading
  ) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }

  if (!conversation) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background px-8">
        <Text variant="title-md" className="text-on-surface">
          Conversation not found
        </Text>
        <Pressable onPress={handleBack} accessibilityRole="button">
          <Text variant="body-md" className="text-primary-tonal">
            Go back to Chat
          </Text>
        </Pressable>
      </View>
    );
  }

  const { participant } = conversation;
  // Full IME overlap as bottom offset (SheetContent equivalent). Do not
  // subtract safe-area — on edge-to-edge that under-lifts and covers Send.
  const androidImeInset =
    Platform.OS === 'android' && keyboardHeight > 0 ? keyboardHeight : 0;
  const composerBottomPad =
    androidImeInset > 0 ? 8 : Math.max(insets.bottom, 10);

  const body = (
    <View style={styles.screen}>
      <ConversationHeader participant={participant} onBack={handleBack} />

      {messagesQuery.isError ? (
        <View className="flex-1 items-center justify-center gap-2 px-8">
          <Text variant="title-md" className="text-on-surface">
            Couldn’t load messages
          </Text>
          <Text
            variant="body-md"
            className="text-primary-tonal"
            onPress={() => void messagesQuery.refetch()}>
            Tap to retry
          </Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          style={styles.list}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            const prev = messages[index - 1];
            const showAvatar = !prev || prev.sender !== item.sender;
            return (
              <MessageBubble
                message={item}
                participant={participant}
                showAvatar={showAvatar}
              />
            );
          }}
          ListHeaderComponent={
            <View className="items-center py-4">
              <View className="rounded-full bg-surface-container px-3 py-1">
                <Text
                  variant="label-sm"
                  className="font-semibold uppercase tracking-widest text-on-surface-variant">
                  Conversation
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View className="items-center px-8 pt-10">
              <Text
                variant="body-md"
                className="text-center text-on-surface-variant">
                No messages yet. Say hello.
              </Text>
            </View>
          }
          contentContainerStyle={{
            // Reserve space for absolute composer (+ IME when open)
            paddingBottom: 88 + androidImeInset,
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            listRef.current?.scrollToEnd({ animated: false });
          }}
        />
      )}

      {/* Absolute bottom anchor — same geometry as SheetContent.sheetAnchor */}
      <View
        pointerEvents="box-none"
        style={[
          styles.composerAnchor,
          { bottom: androidImeInset },
        ]}>
        <ConversationComposer
          sending={sendText.isPending || sendVoice.isPending}
          bottomPadding={composerBottomPad}
          onSend={(body) => sendText.mutate(body.trim())}
          onSendVoiceNote={(input) => sendVoice.mutate(input)}
        />
      </View>
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView
        className="flex-1 bg-background"
        behavior="padding"
        keyboardVerticalOffset={0}>
        {body}
      </KeyboardAvoidingView>
    );
  }

  return <View className="flex-1 bg-background">{body}</View>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  composerAnchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
