import { ArrowLeft, MoreVertical } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/shared/components/ui/text';

import type { MessageParticipant } from '../types';
import { ActiveStatusPip } from './active-status-pip';
import { ParticipantAvatar } from './participant-avatar';

const AVATAR = 40;
const SUBTITLE = '#D0BCFF';

type ConversationHeaderProps = {
  participant: MessageParticipant;
  onBack: () => void;
  onMorePress?: () => void;
};

export function ConversationHeader({
  participant,
  onBack,
  onMorePress,
}: ConversationHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="border-b border-white/5 bg-background px-3"
      style={{ paddingTop: insets.top + 6, paddingBottom: 10 }}>
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-white/5">
          <ArrowLeft size={22} color="#E4E1EA" strokeWidth={2} />
        </Pressable>

        <View style={{ width: AVATAR, height: AVATAR }}>
          <ParticipantAvatar
            id={participant.id}
            name={participant.name}
            avatarUrl={participant.avatarUrl}
            size={AVATAR}
            recyclingKey={`${participant.id}-header`}
          />
          {participant.online ? <ActiveStatusPip /> : null}
        </View>

        <View className="min-w-0 flex-1 pl-1" style={{ gap: 2 }}>
          <Text
            numberOfLines={1}
            className="font-sans text-on-surface"
            style={{ fontSize: 16, lineHeight: 22, fontWeight: '600' }}>
            {participant.name}
          </Text>
          <Text
            numberOfLines={1}
            className="font-sans uppercase"
            style={{
              color: SUBTITLE,
              fontSize: 11,
              lineHeight: 14,
              fontWeight: '500',
              letterSpacing: 0.4,
            }}>
            {participant.role} • {participant.name} Chat
          </Text>
        </View>

        <Pressable
          onPress={onMorePress}
          accessibilityRole="button"
          accessibilityLabel="Conversation options"
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-white/5">
          <MoreVertical size={20} color="#E4E1EA" strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}
