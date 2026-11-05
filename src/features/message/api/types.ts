export type ChatParticipantDto = {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
};

export type ConversationSummaryDto = {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  participant: ChatParticipantDto;
  previewKind: 'text' | 'voice-note';
  previewText: string;
  lastMessageAt: string | null;
  unread: boolean;
};

export type MessageRequestDto = {
  id: string;
  participant: ChatParticipantDto;
  message: string;
  requestedAt: string;
};

export type ChatMessageDto = {
  id: string;
  conversationId: string;
  senderId: string;
  type: 'TEXT' | 'AUDIO';
  body: string | null;
  audioUrl: string | null;
  audioPath: string | null;
  durationMs: number | null;
  createdAt: string;
};

export type CreateConversationRequestBody = {
  userId: string;
  body: string;
};

export type CreateConversationRequestResult = {
  conversation: ConversationSummaryDto;
  message: ChatMessageDto;
};

export type ListMessagesResult = {
  messages: ChatMessageDto[];
  nextCursor: string | null;
};

export type AudioUploadUrlResult = {
  messageId: string;
  upload: {
    path: string;
    signedUrl: string;
    token: string;
  };
};

export type RealtimeTokenResult = {
  token: string;
  expiresIn: number;
  wsUrl: string | null;
};

export type CurrentUserDto = {
  id: string;
  email: string;
  username: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  canChangeUsername: boolean;
  usernameChangeAvailableAt: string | null;
  createdAt: string;
  updatedAt: string;
};
