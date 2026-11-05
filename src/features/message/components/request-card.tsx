import { Camera, Check, Mic, Music, X } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { MessageRequest } from '../types';
import { formatConversationTime } from '../utils/format-message-time';
import { ParticipantAvatar } from './participant-avatar';

/** Figma request card (`91_392`) — 358×140, rx 12 */
const CARD_BG = '#1F1F25';
const ACCENT = '#A078FF';
const ACCENT_INK = '#3C0091';
const NAME = '#E4E1EA';
const HANDLE = '#958EA0';
const MESSAGE = '#CBC3D7';
const DECLINE_BG = '#2A2930';
const AVATAR = 44;
const BADGE = 14;
const GAP = 16;

type RequestCardProps = {
  request: MessageRequest;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
};

export function RequestCard({ request, onAccept, onDecline }: RequestCardProps) {
  const BadgeIcon =
    request.badgeIcon === 'mic'
      ? Mic
      : request.badgeIcon === 'guitar'
        ? Music
        : Camera;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatarWrap}>
          <ParticipantAvatar
            id={request.participant.id}
            name={request.participant.name}
            avatarUrl={request.participant.avatarUrl}
            size={AVATAR}
            border={false}
          />
          <View style={styles.badge}>
            <BadgeIcon size={9} color={ACCENT_INK} strokeWidth={2.6} />
          </View>
        </View>

        {/* Text column starts at x=76 in Figma — clear of the 44px avatar */}
        <View style={styles.content}>
          <View style={styles.nameRow}>
            <View style={styles.nameHandle}>
              <Text numberOfLines={1} style={styles.name}>
                {request.participant.name}
              </Text>
              <Text numberOfLines={1} style={styles.handle}>
                {' '}
                · {request.participant.handle}
              </Text>
            </View>
            <Text style={styles.time}>
              {formatConversationTime(request.requestedAt)}
            </Text>
          </View>

          <Text style={styles.message}>{request.message}</Text>

          <View style={styles.actions}>
            <Pressable
              onPress={() => onAccept(request.id)}
              accessibilityRole="button"
              accessibilityLabel={`Accept request from ${request.participant.name}`}
              style={styles.acceptBtn}>
              <Check size={14} color={ACCENT_INK} strokeWidth={2.8} />
              <Text style={styles.acceptLabel}>Accept</Text>
            </Pressable>

            <Pressable
              onPress={() => onDecline(request.id)}
              accessibilityRole="button"
              accessibilityLabel={`Decline request from ${request.participant.name}`}
              style={styles.declineBtn}>
              <X size={14} color={MESSAGE} strokeWidth={2.4} />
              <Text style={styles.declineLabel}>Decline</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: 16,
    minHeight: 140,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: GAP,
  },
  avatarWrap: {
    width: AVATAR,
    height: AVATAR,
    flexShrink: 0,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
  },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameHandle: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  name: {
    flexShrink: 1,
    color: NAME,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  handle: {
    flexShrink: 1,
    color: HANDLE,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  time: {
    color: HANDLE,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  message: {
    color: MESSAGE,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  acceptBtn: {
    flex: 1,
    height: 32,
    borderRadius: 16,
    backgroundColor: ACCENT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    boxShadow: '0 2px 8px rgba(160, 120, 255, 0.25)',
  },
  acceptLabel: {
    color: ACCENT_INK,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
  },
  declineBtn: {
    flex: 1,
    height: 32,
    borderRadius: 16,
    backgroundColor: DECLINE_BG,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  declineLabel: {
    color: MESSAGE,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
  },
});
