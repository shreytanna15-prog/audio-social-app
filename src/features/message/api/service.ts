import { apiRequest } from '@/core/api';
import { getMe } from '@/features/profile/api/service';

import type {
  AudioUploadUrlResult,
  ChatMessageDto,
  ConversationSummaryDto,
  CreateConversationRequestBody,
  CreateConversationRequestResult,
  CurrentUserDto,
  ListMessagesResult,
  MessageRequestDto,
  RealtimeTokenResult,
} from './types';

export async function getCurrentUser(): Promise<CurrentUserDto> {
  return getMe();
}

export async function createConversationRequest(
  body: CreateConversationRequestBody,
): Promise<CreateConversationRequestResult> {
  return apiRequest<CreateConversationRequestResult>({
    path: '/api/conversations/request',
    method: 'POST',
    body,
  });
}

export async function listConversations(): Promise<ConversationSummaryDto[]> {
  return apiRequest<ConversationSummaryDto[]>({
    path: '/api/conversations',
    method: 'GET',
  });
}

export async function listMessageRequests(): Promise<MessageRequestDto[]> {
  return apiRequest<MessageRequestDto[]>({
    path: '/api/conversations/requests',
    method: 'GET',
  });
}

export async function acceptConversation(
  id: string,
): Promise<ConversationSummaryDto> {
  return apiRequest<ConversationSummaryDto>({
    path: `/api/conversations/${id}/accept`,
    method: 'POST',
  });
}

export async function declineConversation(
  id: string,
): Promise<ConversationSummaryDto> {
  return apiRequest<ConversationSummaryDto>({
    path: `/api/conversations/${id}/decline`,
    method: 'POST',
  });
}

export async function listMessages(
  id: string,
  params?: { cursor?: string; limit?: number },
): Promise<ListMessagesResult> {
  const search = new URLSearchParams();
  if (params?.cursor) search.set('cursor', params.cursor);
  if (params?.limit != null) search.set('limit', String(params.limit));
  const qs = search.toString();
  return apiRequest<ListMessagesResult>({
    path: `/api/conversations/${id}/messages${qs ? `?${qs}` : ''}`,
    method: 'GET',
  });
}

export async function sendTextMessage(
  id: string,
  body: string,
): Promise<ChatMessageDto> {
  return apiRequest<ChatMessageDto>({
    path: `/api/conversations/${id}/messages`,
    method: 'POST',
    body: { type: 'TEXT', body },
  });
}

export async function createAudioUploadUrl(
  id: string,
): Promise<AudioUploadUrlResult> {
  return apiRequest<AudioUploadUrlResult>({
    path: `/api/conversations/${id}/audio-upload-url`,
    method: 'POST',
  });
}

export async function sendAudioMessage(
  id: string,
  payload: { path: string; durationMs: number },
): Promise<ChatMessageDto> {
  return apiRequest<ChatMessageDto>({
    path: `/api/conversations/${id}/messages/audio`,
    method: 'POST',
    body: payload,
  });
}

export async function createRealtimeToken(
  id: string,
): Promise<RealtimeTokenResult> {
  return apiRequest<RealtimeTokenResult>({
    path: `/api/conversations/${id}/realtime-token`,
    method: 'POST',
  });
}

export async function uploadChatAudio(
  signedUrl: string,
  localUri: string,
): Promise<void> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const uploadResponse = await fetch(signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'audio/mp4',
    },
    body: blob,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Upload failed (${uploadResponse.status}). Try again.`);
  }
}
