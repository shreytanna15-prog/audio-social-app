import { Award, Clock, Headphones, Share2, Upload, Zap } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

type ChallengeCardProps = {
  title?: string;
  description?: string;
  endsIn?: string;
  prize?: string;
  prizeLabel?: string;
  statusLabel?: string;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  secondaryAction?: 'listen' | 'share';
  onPrimaryPress?: () => void;
  onSecondaryPress?: () => void;
};

export function ChallengeCard({
  title = 'Sound Clash: Synthwave Odyssey',
  description = 'Submit your original vocal or instrumental track built around the exclusive VibeOGram analog sample kit.',
  endsIn = 'Ends in 2d 14h',
  prize = '$2,500 Studio Grant + Official Release',
  prizeLabel = 'Grand Prize',
  statusLabel = 'Active Challenge',
  primaryActionLabel = 'Enter Contest',
  secondaryActionLabel = 'Listen Entries',
  secondaryAction = 'listen',
  onPrimaryPress,
  onSecondaryPress,
}: ChallengeCardProps) {
  return (
    <View className="mx-4 gap-4 rounded-2xl border border-white/5 bg-surface-container p-4">
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-row items-center gap-1.5 rounded-full bg-[#FFB0CD] px-2.5 py-1.5">
          <Zap size={12} color="#640039" strokeWidth={2.4} fill="#640039" />
          <Text variant="caption" className="font-semibold text-[#640039]">
            {statusLabel}
          </Text>
        </View>

        <View className="flex-row items-center gap-1.5 rounded-full bg-surface-container-high px-2.5 py-1.5">
          <Clock size={12} color="#D0BCFF" strokeWidth={2} />
          <Text variant="caption" className="font-medium text-on-surface">
            {endsIn}
          </Text>
        </View>
      </View>

      <View className="gap-2">
        <Text variant="headline-md" className="text-on-surface">
          {title}
        </Text>
        <Text variant="body-md" className="text-on-surface-variant">
          {description}
        </Text>
      </View>

      <View className="flex-row items-center gap-3 rounded-xl bg-surface-container-high p-3">
        <View className="h-11 w-11 items-center justify-center rounded-xl bg-surface-container-highest">
          <Award size={20} color="#D0BCFF" strokeWidth={2} />
        </View>
        <View className="min-w-0 flex-1 gap-0.5">
          <Text variant="label-sm" className="uppercase text-on-surface-variant">
            {prizeLabel}
          </Text>
          <Text variant="title-md" className="text-primary-tonal" numberOfLines={1}>
            {prize}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-2.5">
        <Pressable
          onPress={onPrimaryPress}
          accessibilityRole="button"
          accessibilityLabel={primaryActionLabel}
          className="h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-full bg-primary-tonal px-3">
          <Upload size={15} color="#3C0091" strokeWidth={2.2} />
          <Text variant="label-md" className="font-semibold text-on-primary">
            {primaryActionLabel}
          </Text>
        </Pressable>

        {secondaryAction === 'share' ? (
          <Pressable
            onPress={onSecondaryPress}
            accessibilityRole="button"
            accessibilityLabel="Share challenge"
            className="h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-surface-container-high">
            <Share2 size={16} color="#E4E1EA" strokeWidth={2} />
          </Pressable>
        ) : (
          <Pressable
            onPress={onSecondaryPress}
            accessibilityRole="button"
            accessibilityLabel={secondaryActionLabel}
            className="h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-full border border-white/10 bg-surface-container-high px-3">
            <Headphones size={15} color="#E4E1EA" strokeWidth={2} />
            <Text variant="label-md" className="font-semibold text-on-surface">
              {secondaryActionLabel}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
