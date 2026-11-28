import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronDown, ChevronUp, Clock, Trophy } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/shared/components/layout/screen-header';
import { Text } from '@/shared/components/ui/text';
import { TRACK_GENRE_LABELS } from '@/features/tracks/constants/track-genres';
import type { TrackGenreId } from '@/features/tracks/constants/track-genres';

import { useCastContestVote, useContest, useContestEntries } from '../api/hooks';
import { ContestEntryRow } from '../components/contest-entry-row';
import { ContestPrizeTiers } from '../components/contest-prize-tiers';
import { useCountdownNow } from '../hooks/use-countdown-now';
import {
  phaseCountdownLabel,
  phaseStatusLabel,
  phaseStatusStyle,
} from '../utils/phase-countdown';

const dateFmt = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
});

function formatShortDate(iso: string) {
  return dateFmt.format(new Date(iso));
}

export function ContestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const contestQuery = useContest(id);
  const entriesQuery = useContestEntries(id);
  const vote = useCastContestVote(id);
  const now = useCountdownNow();
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [rulesExpanded, setRulesExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const contest = contestQuery.data;
  const entries =
    entriesQuery.data?.pages.flatMap((page) => page.items) ?? [];

  const refetchContestPage = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        contestQuery.refetch(),
        entriesQuery.refetch(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  if (contestQuery.isLoading) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Contest" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D0BCFF" />
        </View>
      </View>
    );
  }

  if (contestQuery.isError || !contest) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Contest" />
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <Text
            variant="body-md"
            className="text-center text-on-surface-variant">
            Could not load this contest.
          </Text>
          <Pressable onPress={() => void contestQuery.refetch()}>
            <Text variant="title-md" className="text-primary-tonal">
              Retry
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const countdownLabel = phaseCountdownLabel(contest, now);
  const phaseStyle = phaseStatusStyle(contest.phase);
  const showEntries =
    contest.phase === 'vote' || contest.phase === 'submit';
  const canSubmit =
    contest.phase === 'submit' && !contest.hasEntered;
  const showLeaderboard = contest.phase === 'closed';
  const stickyBottomPad = Math.max(insets.bottom, 12);
  const hasStickyCta = canSubmit || showLeaderboard;
  const isSoftFetching =
    (contestQuery.isFetching || entriesQuery.isFetching) &&
    !refreshing &&
    !contestQuery.isLoading;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={contest.title} />
      {isSoftFetching ? (
        <View className="items-center py-1.5">
          <ActivityIndicator color="#D0BCFF" size="small" />
        </View>
      ) : null}
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refetchContestPage()}
            tintColor="#D0BCFF"
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom:
            stickyBottomPad + (hasStickyCta ? 88 : 24),
          gap: 20,
        }}>
        <View className="gap-3">
          <View className="flex-row flex-wrap items-center gap-2">
            <View
              className={`flex-row items-center gap-1.5 rounded-full px-2.5 py-1.5 ${phaseStyle.chipClassName}`}>
              <Trophy
                size={12}
                color={phaseStyle.iconColor}
                strokeWidth={2.4}
              />
              <Text
                variant="caption"
                className={`font-semibold ${phaseStyle.textClassName}`}>
                {phaseStatusLabel(contest.phase)}
              </Text>
            </View>
            {countdownLabel ? (
              <View className="flex-row items-center gap-1.5 rounded-full bg-surface-container-high px-2.5 py-1.5">
                <Clock size={12} color="#D0BCFF" strokeWidth={2} />
                <Text variant="caption" className="font-medium text-on-surface">
                  {countdownLabel}
                </Text>
              </View>
            ) : null}
          </View>

          <Text variant="headline-md" className="text-on-surface">
            {contest.title}
          </Text>

          <View className="gap-1.5">
            <Text
              variant="body-md"
              className="text-on-surface-variant"
              numberOfLines={descriptionExpanded ? undefined : 3}>
              {contest.description}
            </Text>
            {contest.description.length > 120 ? (
              <Pressable
                onPress={() => setDescriptionExpanded((v) => !v)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={
                  descriptionExpanded
                    ? 'Show less description'
                    : 'Read more description'
                }>
                <Text variant="label-sm" className="text-primary-tonal">
                  {descriptionExpanded ? 'Show less' : 'Read more'}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {contest.genreIds.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {contest.genreIds.map((genreId) => (
                <View
                  key={genreId}
                  className="rounded-full bg-surface-container-high px-3 py-1.5">
                  <Text
                    variant="label-sm"
                    className="text-on-surface-variant">
                    {TRACK_GENRE_LABELS[genreId as TrackGenreId] ?? genreId}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View className="rounded-2xl border border-white/5 bg-surface-container p-4">
          <ContestPrizeTiers contest={contest} variant="detail" />
        </View>

        <View className="flex-row gap-2">
          <View className="min-w-0 flex-1 gap-1 rounded-2xl border border-white/5 bg-surface-container px-3 py-3">
            <Text variant="label-sm" className="text-on-surface-variant">
              Submit
            </Text>
            <Text
              variant="caption"
              className="font-medium text-on-surface"
              numberOfLines={2}>
              {formatShortDate(contest.submitStartAt)} –{' '}
              {formatShortDate(contest.submitEndAt)}
            </Text>
          </View>
          <View className="min-w-0 flex-1 gap-1 rounded-2xl border border-white/5 bg-surface-container px-3 py-3">
            <Text variant="label-sm" className="text-on-surface-variant">
              Vote ends
            </Text>
            <Text
              variant="caption"
              className="font-medium text-on-surface"
              numberOfLines={1}>
              {formatShortDate(contest.voteEndAt)}
            </Text>
          </View>
          <View className="min-w-0 flex-1 gap-1 rounded-2xl border border-white/5 bg-surface-container px-3 py-3">
            <Text variant="label-sm" className="text-on-surface-variant">
              Entries
            </Text>
            <Text variant="title-md" className="text-on-surface">
              {contest.entryCount}
            </Text>
          </View>
        </View>

        {contest.hasEntered ? (
          <View className="rounded-2xl border border-primary-tonal/25 bg-primary-tonal/10 px-4 py-3">
            <Text variant="title-md" className="text-primary-tonal">
              You entered this contest
            </Text>
            <Text variant="body-md" className="mt-1 text-on-surface-variant">
              Your track is locked in for this round.
            </Text>
          </View>
        ) : null}

        {contest.phase === 'announce' || contest.phase === 'upcoming' ? (
          <View className="rounded-2xl border border-white/5 bg-surface-container px-4 py-3">
            <Text variant="body-md" className="text-on-surface-variant">
              Submissions open {formatShortDate(contest.submitStartAt)}.
            </Text>
          </View>
        ) : null}

        {contest.hasVoted ? (
          <View className="rounded-2xl border border-white/5 bg-surface-container px-4 py-3">
            <Text variant="body-md" className="text-on-surface-variant">
              You already voted in this contest.
            </Text>
          </View>
        ) : null}

        {showEntries ? (
          <View className="gap-3">
            <Text variant="title-md" className="text-on-surface">
              Entries
              <Text variant="body-md" className="text-on-surface-variant">
                {' '}
                · {contest.entryCount}
              </Text>
            </Text>
            {entriesQuery.isLoading ? (
              <View className="items-center py-8">
                <ActivityIndicator color="#D0BCFF" />
              </View>
            ) : entries.length === 0 ? (
              <View className="rounded-2xl border border-white/5 bg-surface-container px-4 py-6">
                <Text
                  variant="body-md"
                  className="text-center text-on-surface-variant">
                  No entries yet.
                </Text>
              </View>
            ) : (
              entries.map((entry) => {
                const canVote =
                  contest.phase === 'vote' &&
                  !contest.hasVoted &&
                  entry.id !== contest.myEntryId;
                return (
                  <ContestEntryRow
                    key={entry.id}
                    entry={entry}
                    canVote={canVote}
                    votePending={vote.isPending}
                    onVote={() => vote.mutate(entry.id)}
                  />
                );
              })
            )}
          </View>
        ) : null}

        <View className="overflow-hidden rounded-2xl border border-white/5 bg-surface-container">
          <Pressable
            onPress={() => setRulesExpanded((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ expanded: rulesExpanded }}
            className="flex-row items-center justify-between px-4 py-3.5">
            <Text variant="title-md" className="text-on-surface">
              Rules
            </Text>
            {rulesExpanded ? (
              <ChevronUp size={18} color="#CBC3D7" strokeWidth={2} />
            ) : (
              <ChevronDown size={18} color="#CBC3D7" strokeWidth={2} />
            )}
          </Pressable>
          {rulesExpanded ? (
            <View className="border-t border-white/5 px-4 pb-4 pt-3">
              <Text variant="body-md" className="text-on-surface-variant">
                {contest.rules}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {hasStickyCta ? (
        <View
          className="border-t border-white/5 bg-background px-4 pt-3"
          style={{ paddingBottom: stickyBottomPad }}>
          {canSubmit ? (
            <Pressable
              onPress={() =>
                router.push(`/contests/${id}/submit` as Href)
              }
              accessibilityRole="button"
              className="h-12 items-center justify-center rounded-full bg-primary-tonal">
              <Text variant="title-md" className="text-[#3C0091]">
                Submit a track
              </Text>
            </Pressable>
          ) : null}
          {showLeaderboard ? (
            <Pressable
              onPress={() =>
                router.push(`/contests/${id}/leaderboard` as Href)
              }
              accessibilityRole="button"
              className="h-12 items-center justify-center rounded-full border border-primary-tonal">
              <Text variant="title-md" className="text-primary-tonal">
                View leaderboard
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
