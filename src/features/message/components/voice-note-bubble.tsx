import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { Mic, Pause, Play } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { ChatVoiceNoteMessage } from '../types';

const ACCENT = '#D0BCFF';

type VoiceNoteBubbleProps = {
  message: ChatVoiceNoteMessage;
  isMe: boolean;
};

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function VoiceNoteBubble({ message, isMe }: VoiceNoteBubbleProps) {
  const playerRef = useRef<AudioPlayer | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => {
      playerRef.current?.remove();
      playerRef.current = null;
    };
  }, []);

  const toggle = async () => {
    if (!message.audioUrl) return;

    if (!playerRef.current) {
      playerRef.current = createAudioPlayer(message.audioUrl);
    }

    const player = playerRef.current;
    if (playing) {
      player.pause();
      setPlaying(false);
      return;
    }

    player.play();
    setPlaying(true);
  };

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="button"
      accessibilityLabel={`Voice note ${formatDuration(message.durationMs)}`}
      className="flex-row items-center gap-3 rounded-2xl px-3.5 py-3"
      style={{
        backgroundColor: isMe ? 'transparent' : '#2A2A32',
        experimental_backgroundImage: isMe
          ? 'linear-gradient(115deg, #A078FF 0%, #7B5CFF 55%, #6338FF 100%)'
          : undefined,
        borderCurve: 'continuous',
        minWidth: 160,
      }}>
      <View className="h-9 w-9 items-center justify-center rounded-full bg-black/20">
        {playing ? (
          <Pause size={16} color={isMe ? '#1B1B21' : ACCENT} strokeWidth={2.4} />
        ) : message.audioUrl ? (
          <Play size={16} color={isMe ? '#1B1B21' : ACCENT} strokeWidth={2.4} />
        ) : (
          <Mic size={16} color={isMe ? '#1B1B21' : ACCENT} strokeWidth={2.4} />
        )}
      </View>
      <View className="gap-0.5">
        <Text
          variant="label-md"
          className={isMe ? 'text-[#1B1B21]' : 'text-on-surface'}>
          Voice note
        </Text>
        <Text
          variant="caption"
          className={isMe ? 'text-[#1B1B21]/80' : 'text-on-surface-variant'}>
          {formatDuration(message.durationMs)}
        </Text>
      </View>
    </Pressable>
  );
}
