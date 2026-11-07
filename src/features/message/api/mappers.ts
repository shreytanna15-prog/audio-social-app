import type {
  ChatMessage,
  ConversationPreview,
  MessageParticipant,
  MessageRequest,
} from '../types';
import type {
  ChatMessageDto,
  ChatParticipantDto,
  ConversationSummaryDto,
  MessageRequestDto,
} from './types';

export function mapParticipant(
  participant: ChatParticipantDto,
): MessageParticipant {
  const displayName = participant.name?.trim() || participant.username;
  return {
    id: participant.id,
    name: displayName,
    handle: `@${participant.username}`,
    role: 'Artist',
    avatarUrl: participant.avatarUrl,
    online: false,
  };
}

export function mapConversationPreview(
  dto: ConversationSummaryDto,
): ConversationPreview {
  return {
    id: dto.id,
    status: dto.status,
    participant: mapParticipant(dto.participant),
    previewKind: dto.previewKind,
    previewText: dto.previewText,
    lastMessageAt: dto.lastMessageAt ?? new Date(0).toISOString(),
    unread: dto.unread,
  };
}

export function mapMessageRequest(dto: MessageRequestDto): MessageRequest {
  return {
    id: dto.id,
    participant: mapParticipant(dto.participant),
    badgeIcon: 'mic',
    message: dto.message,
    requestedAt: dto.requestedAt,
  };
}

export function mapChatMessage(
  dto: ChatMessageDto,
  currentUserId: string,
): ChatMessage {
  const sender = dto.senderId === currentUserId ? 'me' : 'them';

  if (dto.type === 'AUDIO') {
    return {
      id: dto.id,
      conversationId: dto.conversationId,
      kind: 'voice-note',
      audioUrl: dto.audioUrl,
      durationMs: dto.durationMs ?? 0,
      sender,
      sentAt: dto.createdAt,
    };
  }

  return {
    id: dto.id,
    conversationId: dto.conversationId,
    kind: 'text',
    body: dto.body ?? '',
    sender,
    sentAt: dto.createdAt,
  };
}
