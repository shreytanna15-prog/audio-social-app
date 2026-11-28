import { Clock, Trophy } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { ContestSummary } from '../api/types';
import { useCountdownNow } from '../hooks/use-countdown-now';
import {
  phaseCountdownLabel,
  phaseStatusLabel,
  phaseStatusStyle,
} from '../utils/phase-countdown';
import { ContestPrizeTiers } from './contest-prize-tiers';

type ContestCardProps = {
  contest: ContestSummary;
  variant?: 'home' | 'explore';
  onPress?: () => void;
};

export function ContestCard({
  contest,
  variant = 'home',
  onPress,
}: ContestCardProps) {
  const now = useCountdownNow();
  const countdownLabel = phaseCountdownLabel(contest, now);
  const phaseStyle = phaseStatusStyle(contest.phase);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={contest.title}
      className={
        variant === 'explore'
          ? 'mx-4 gap-3 rounded-2xl border border-primary-tonal/20 bg-surface-container-low p-4'
          : 'mx-4 gap-4 rounded-2xl border border-white/5 bg-surface-container p-4'
      }>
      <View className="flex-row items-center justify-between gap-2">
        <View
          className={`flex-row items-center gap-1.5 rounded-full px-2.5 py-1.5 ${phaseStyle.chipClassName}`}>
          <Trophy size={12} color={phaseStyle.iconColor} strokeWidth={2.4} />
          <Text
            variant="caption"
            className={`font-semibold ${phaseStyle.textClassName}`}>
            {phaseStatusLabel(contest.phase)}
          </Text>
        </View>
        {countdownLabel ? (
          <View className="max-w-[58%] flex-row items-center gap-1.5 rounded-full bg-surface-container-high px-2.5 py-1.5">
            <Clock size={12} color="#D0BCFF" strokeWidth={2} />
            <Text
              variant="caption"
              className="shrink font-medium text-on-surface"
              numberOfLines={1}>
              {countdownLabel}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="gap-2">
        <Text variant="headline-md" className="text-on-surface" numberOfLines={2}>
          {contest.title}
        </Text>
        <Text
          variant="body-md"
          className="text-on-surface-variant"
          numberOfLines={3}>
          {contest.description}
        </Text>
      </View>

      <ContestPrizeTiers contest={contest} />
    </Pressable>
  );
}
