export type MessagePreviewKind = 'text' | 'voice-note';

export type MessageParticipant = {
  id: string;
  name: string;
  handle: string;
  role: string;
  avatarUrl: string | null;
  /** Online / active presence — UI-only stub in v1 */
  online?: boolean;
};

export type ConversationPreview = {
  id: string;
  participant: MessageParticipant;
  previewKind: MessagePreviewKind;
  previewText: string;
  /** ISO timestamp of the latest activity */
  lastMessageAt: string;
  unread: boolean;
};

export type MessageRequest = {
  id: string;
  participant: MessageParticipant;
  badgeIcon: 'mic' | 'guitar' | 'camera';
  message: string;
  requestedAt: string;
};

export type ChatTextMessage = {
  id: string;
  conversationId: string;
  kind: 'text';
  body: string;
  sender: 'me' | 'them';
  sentAt: string;
  seen?: boolean;
};

export type ChatVoiceNoteMessage = {
  id: string;
  conversationId: string;
  kind: 'voice-note';
  audioUrl: string | null;
  durationMs: number;
  sender: 'me' | 'them';
  sentAt: string;
};

export type ChatMessage = ChatTextMessage | ChatVoiceNoteMessage;

export type ConversationThread = {
  conversationId: string;
  messages: ChatMessage[];
};
