import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { MESSAGES_QUERY_KEY } from '../api/hooks';
import type { ChatMessageDto } from '../api/types';
import { createRealtimeToken } from '../api/service';

type RealtimeEvent =
  | { type: 'message.created'; conversationId: string; message: ChatMessageDto }
  | { type: 'conversation.accepted' | 'conversation.declined'; conversationId: string };

/**
 * Subscribe to Worker WS while the conversation screen is mounted.
 * No-ops when realtime is not configured (wsUrl null).
 */
export function useConversationRealtime(conversationId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    let closed = false;
    let socket: WebSocket | null = null;

    void (async () => {
      try {
        const tokenPayload = await createRealtimeToken(conversationId);
        if (closed || !tokenPayload.wsUrl) return;

        const url = `${tokenPayload.wsUrl}?token=${encodeURIComponent(tokenPayload.token)}`;
        socket = new WebSocket(url);

        socket.onmessage = (event) => {
          try {
            const payload = JSON.parse(String(event.data)) as RealtimeEvent;
            if (
              payload.type === 'message.created' &&
              payload.conversationId === conversationId &&
              payload.message
            ) {
              queryClient.setQueryData(
                [...MESSAGES_QUERY_KEY, conversationId],
                (
                  previous:
                    | { messages: ChatMessageDto[]; nextCursor: string | null }
                    | undefined,
                ) => {
                  if (!previous) {
                    return { messages: [payload.message], nextCursor: null };
                  }
                  if (
                    previous.messages.some(
                      (item) => item.id === payload.message.id,
                    )
                  ) {
                    return previous;
                  }
                  return {
                    ...previous,
                    messages: [...previous.messages, payload.message],
                  };
                },
              );
              void queryClient.invalidateQueries({
                queryKey: ['conversations'],
              });
            }
          } catch {
            // ignore malformed payloads
          }
        };
      } catch {
        // realtime optional — history still works via REST
      }
    })();

    return () => {
      closed = true;
      socket?.close();
    };
  }, [conversationId, queryClient]);
}
