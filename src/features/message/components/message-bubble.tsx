import { CheckCheck } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { ChatMessage, MessageParticipant } from '../types';
import { formatMessageClock } from '../utils/format-message-time';
import { ParticipantAvatar } from './participant-avatar';
import { VoiceNoteBubble } from './voice-note-bubble';

const AVATAR = 28;
const AVATAR_GAP = 8;

type MessageBubbleProps = {
  message: ChatMessage;
  participant: MessageParticipant;
  showAvatar: boolean;
};

export function MessageBubble({
  message,
  participant,
  showAvatar,
}: MessageBubbleProps) {
  const isMe = message.sender === 'me';
  const timeLabel = formatMessageClock(message.sentAt);
  const statusLabel =
    isMe && message.kind === 'text' && message.seen
      ? `Seen ${timeLabel}`
      : timeLabel;

  const bubble =
    message.kind === 'voice-note' ? (
      <VoiceNoteBubble message={message} isMe={isMe} />
    ) : (
      <View
        style={[styles.bubble, isMe ? styles.sentBubble : styles.receivedBubble]}>
        <Text variant="body-lg" className="text-on-surface">
          {message.body}
        </Text>
      </View>
    );

  const meta = (
    <View style={[styles.meta, isMe ? styles.metaMe : styles.metaThem]}>
      <Text variant="caption" className="text-on-surface-variant">
        {statusLabel}
      </Text>
      {isMe && message.kind === 'text' && message.seen ? (
        <CheckCheck size={12} color="#D0BCFF" strokeWidth={2.2} />
      ) : null}
    </View>
  );

  const a11yBody =
    message.kind === 'text' ? message.body : 'Voice note';

  if (isMe) {
    return (
      <View
        style={[styles.wrap, styles.wrapMe]}
        accessibilityRole="text"
        accessibilityLabel={`You: ${a11yBody}, ${statusLabel}`}>
        {bubble}
        {meta}
      </View>
    );
  }

  return (
    <View
      style={[styles.wrap, styles.wrapThem]}
      accessibilityRole="text"
      accessibilityLabel={`${participant.name}: ${a11yBody}, ${statusLabel}`}>
      <View style={styles.bubbleRow}>
        <View style={styles.avatarSlot}>
          {showAvatar ? (
            <ParticipantAvatar
              id={participant.id}
              name={participant.name}
              avatarUrl={participant.avatarUrl}
              size={AVATAR}
              recyclingKey={`${participant.id}-bubble`}
              border={false}
            />
          ) : null}
        </View>
        <View style={styles.bubbleOnly}>{bubble}</View>
      </View>

      <View style={styles.metaIndent}>{meta}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
    paddingHorizontal: 16,
    gap: 4,
  },
  wrapThem: {
    alignItems: 'flex-start',
  },
  wrapMe: {
    alignItems: 'flex-end',
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: AVATAR_GAP,
    maxWidth: '100%',
  },
  avatarSlot: {
    width: AVATAR,
    height: AVATAR,
    flexShrink: 0,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  bubbleOnly: {
    flexShrink: 1,
    maxWidth: '78%',
  },
  metaIndent: {
    marginLeft: AVATAR + AVATAR_GAP,
  },
  bubble: {
    borderRadius: 16,
    borderCurve: 'continuous',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  receivedBubble: {
    backgroundColor: '#2A2A32',
  },
  sentBubble: {
    experimental_backgroundImage:
      'linear-gradient(115deg, #A078FF 0%, #7B5CFF 55%, #6338FF 100%)',
    maxWidth: '78%',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 2,
  },
  metaThem: {
    justifyContent: 'flex-start',
  },
  metaMe: {
    justifyContent: 'flex-end',
  },
});
