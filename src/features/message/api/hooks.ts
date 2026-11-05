import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ME_QUERY_KEY, useMe } from '@/features/profile/api/hooks';

import {
  acceptConversation,
  createAudioUploadUrl,
  createConversationRequest,
  createRealtimeToken,
  declineConversation,
  listConversations,
  listMessageRequests,
  listMessages,
  sendAudioMessage,
  sendTextMessage,
  uploadChatAudio,
} from './service';
import type { ChatMessageDto, CreateConversationRequestBody } from './types';

export const CURRENT_USER_QUERY_KEY = ME_QUERY_KEY;
export const CONVERSATIONS_QUERY_KEY = ['conversations'] as const;
export const MESSAGE_REQUESTS_QUERY_KEY = ['conversations', 'requests'] as const;
export const MESSAGES_QUERY_KEY = ['conversations', 'messages'] as const;

export function useCurrentUser() {
  return useMe();
}

export function useConversations() {
  return useQuery({
    queryKey: CONVERSATIONS_QUERY_KEY,
    queryFn: listConversations,
  });
}

export function useMessageRequests() {
  return useQuery({
    queryKey: MESSAGE_REQUESTS_QUERY_KEY,
    queryFn: listMessageRequests,
  });
}

export function useConversationMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: [...MESSAGES_QUERY_KEY, conversationId],
    queryFn: () => listMessages(conversationId!),
    enabled: Boolean(conversationId),
  });
}

export function useCreateConversationRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateConversationRequestBody) =>
      createConversationRequest(body),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: MESSAGE_REQUESTS_QUERY_KEY }),
      ]);
    },
  });
}

export function useAcceptConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => acceptConversation(id),
    onSuccess: async (data) => {
      queryClient.setQueryData(
        CONVERSATIONS_QUERY_KEY,
        (previous: import('./types').ConversationSummaryDto[] | undefined) => {
          if (!previous) return [data];
          if (previous.some((item) => item.id === data.id)) {
            return previous.map((item) => (item.id === data.id ? data : item));
          }
          return [data, ...previous];
        },
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: MESSAGE_REQUESTS_QUERY_KEY }),
        queryClient.invalidateQueries({
          queryKey: [...MESSAGES_QUERY_KEY, data.id],
        }),
      ]);
    },
  });
}

export function useDeclineConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => declineConversation(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: MESSAGE_REQUESTS_QUERY_KEY,
      });
    },
  });
}

export function useSendTextMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => sendTextMessage(conversationId, body),
    onSuccess: async (message) => {
      appendMessageToCache(queryClient, conversationId, message);
      await queryClient.invalidateQueries({
        queryKey: CONVERSATIONS_QUERY_KEY,
      });
    },
  });
}

export function useSendVoiceNote(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { uri: string; durationMs: number }) => {
      const upload = await createAudioUploadUrl(conversationId);
      await uploadChatAudio(upload.upload.signedUrl, input.uri);
      return sendAudioMessage(conversationId, {
        path: upload.upload.path,
        durationMs: input.durationMs,
      });
    },
    onSuccess: async (message) => {
      appendMessageToCache(queryClient, conversationId, message);
      await queryClient.invalidateQueries({
        queryKey: CONVERSATIONS_QUERY_KEY,
      });
    },
  });
}

export function useRealtimeToken(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['conversations', 'realtime-token', conversationId],
    queryFn: () => createRealtimeToken(conversationId!),
    enabled: Boolean(conversationId),
    staleTime: 60_000,
  });
}

function appendMessageToCache(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: string,
  message: ChatMessageDto,
) {
  queryClient.setQueryData(
    [...MESSAGES_QUERY_KEY, conversationId],
    (previous: { messages: ChatMessageDto[]; nextCursor: string | null } | undefined) => {
      if (!previous) {
        return { messages: [message], nextCursor: null };
      }
      if (previous.messages.some((item) => item.id === message.id)) {
        return previous;
      }
      return {
        ...previous,
        messages: [...previous.messages, message],
      };
    },
  );
}
