import { Mic } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { ConversationPreview } from '../types';
import { formatConversationTime } from '../utils/format-message-time';
import { ActiveStatusPip } from './active-status-pip';
import { ParticipantAvatar } from './participant-avatar';

/** Figma chat list tokens */
const ACCENT = '#A078FF';
const PREVIEW = '#958EA0';
const TIME = '#958EA0';
const AVATAR = 56;

type ConversationRowProps = {
  conversation: ConversationPreview;
  onPress: (id: string) => void;
};

export function ConversationRow({ conversation, onPress }: ConversationRowProps) {
  const { id, participant, previewKind, previewText, lastMessageAt, unread } =
    conversation;

  return (
    <Pressable
      onPress={() => onPress(id)}
      accessibilityRole="button"
      accessibilityLabel={`${participant.name}${participant.online ? ', online' : ''}, ${previewText}${unread ? ', unread' : ''}`}
      className="flex-row items-center active:bg-white/5"
      style={{
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
      }}>
      <View style={{ width: AVATAR, height: AVATAR }}>
        <ParticipantAvatar
          id={participant.id}
          name={participant.name}
          avatarUrl={participant.avatarUrl}
          size={AVATAR}
        />
        {participant.online ? <ActiveStatusPip /> : null}
      </View>

      <View className="min-w-0 flex-1" style={{ gap: 4 }}>
        <View className="flex-row items-center gap-2">
          <Text
            numberOfLines={1}
            className="min-w-0 flex-1 font-sans text-on-surface"
            style={{
              fontSize: 16,
              lineHeight: 22,
              fontWeight: '600',
              letterSpacing: 0,
            }}>
            {participant.name}
          </Text>

          <View className="flex-row items-center" style={{ gap: 6 }}>
            <Text
              className="font-sans"
              style={{
                color: TIME,
                fontSize: 12,
                lineHeight: 16,
                fontWeight: '400',
                letterSpacing: 0,
              }}>
              {formatConversationTime(lastMessageAt)}
            </Text>
            {unread ? (
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: ACCENT,
                }}
                accessibilityLabel="Unread"
              />
            ) : null}
          </View>
        </View>

        <View className="flex-row items-center" style={{ gap: 6 }}>
          {previewKind === 'voice-note' ? (
            <Mic size={14} color={PREVIEW} strokeWidth={2} />
          ) : null}
          <Text
            numberOfLines={1}
            className="min-w-0 flex-1 font-sans"
            style={{
              color: PREVIEW,
              fontSize: 14,
              lineHeight: 20,
              fontWeight: '400',
              letterSpacing: 0,
            }}>
            {previewText}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
