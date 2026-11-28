import { Trophy } from 'lucide-react-native';
import { View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { ContestSummary } from '../api/types';

const PLACE_STYLES = {
  first: {
    short: '1st',
    full: '1st place',
    chip: 'bg-[#E8C47C]/15',
    text: 'text-[#E8C47C]',
    accent: '#E8C47C',
  },
  second: {
    short: '2nd',
    full: '2nd place',
    chip: 'bg-[#C5C8D0]/15',
    text: 'text-[#C5C8D0]',
    accent: '#C5C8D0',
  },
  third: {
    short: '3rd',
    full: '3rd place',
    chip: 'bg-[#D4A574]/15',
    text: 'text-[#D4A574]',
    accent: '#D4A574',
  },
} as const;

type PlaceKey = keyof typeof PLACE_STYLES;

function CardTier({
  place,
  coins,
}: {
  place: PlaceKey;
  coins: number;
}) {
  const style = PLACE_STYLES[place];
  return (
    <View
      className={`min-w-0 flex-1 items-center gap-1 rounded-xl ${style.chip} px-2 py-2.5`}>
      <Text
        variant="label-sm"
        className={`font-semibold uppercase ${style.text}`}>
        {style.short}
      </Text>
      <Text variant="title-md" className="text-on-surface">
        {coins}
      </Text>
      <Text variant="caption" className="text-on-surface-variant">
        coins
      </Text>
    </View>
  );
}

function DetailTier({
  place,
  coins,
  emphasized = false,
}: {
  place: PlaceKey;
  coins: number;
  emphasized?: boolean;
}) {
  const style = PLACE_STYLES[place];

  return (
    <View
      className={`flex-row items-center gap-3 rounded-2xl ${style.chip} ${
        emphasized ? 'px-4 py-4' : 'px-3.5 py-3'
      }`}>
      <View
        className={`items-center justify-center rounded-xl bg-surface-container-lowest/40 ${
          emphasized ? 'h-12 w-12' : 'h-10 w-10'
        }`}>
        <Trophy
          size={emphasized ? 22 : 18}
          color={style.accent}
          strokeWidth={2.2}
        />
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <Text
          variant="label-sm"
          className={`font-semibold uppercase ${style.text}`}>
          {style.full}
        </Text>
        <Text
          variant={emphasized ? 'headline-md' : 'title-md'}
          className="text-on-surface">
          {coins}{' '}
          <Text
            variant="body-md"
            className="text-on-surface-variant">
            coins
          </Text>
        </Text>
      </View>
    </View>
  );
}

type ContestPrizeTiersProps = {
  contest: Pick<
    ContestSummary,
    | 'placementMode'
    | 'prizeCoinsFirst'
    | 'prizeCoinsSecond'
    | 'prizeCoinsThird'
  >;
  variant?: 'card' | 'detail';
  showLabel?: boolean;
};

export function ContestPrizeTiers({
  contest,
  variant = 'card',
  showLabel = true,
}: ContestPrizeTiersProps) {
  const showTopThree = contest.placementMode === 'TOP_THREE';

  if (variant === 'detail') {
    return (
      <View className="gap-3">
        <View className="gap-1">
          {showLabel ? (
            <Text
              variant="label-sm"
              className="uppercase text-on-surface-variant">
              Prize pool
            </Text>
          ) : null}
          <Text variant="body-md" className="text-on-surface-variant">
            {showTopThree
              ? 'Top 3 places earn coins when results settle.'
              : 'Winner takes the coin prize when results settle.'}
          </Text>
        </View>

        <View className="gap-2">
          <DetailTier
            place="first"
            coins={contest.prizeCoinsFirst}
            emphasized
          />
          {showTopThree ? (
            <>
              <DetailTier
                place="second"
                coins={contest.prizeCoinsSecond ?? 0}
              />
              <DetailTier
                place="third"
                coins={contest.prizeCoinsThird ?? 0}
              />
            </>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View className="gap-2">
      {showLabel ? (
        <Text variant="label-sm" className="uppercase text-on-surface-variant">
          Prize
        </Text>
      ) : null}
      <View className="flex-row gap-2">
        <CardTier place="first" coins={contest.prizeCoinsFirst} />
        {showTopThree ? (
          <>
            <CardTier
              place="second"
              coins={contest.prizeCoinsSecond ?? 0}
            />
            <CardTier place="third" coins={contest.prizeCoinsThird ?? 0} />
          </>
        ) : null}
      </View>
    </View>
  );
}
