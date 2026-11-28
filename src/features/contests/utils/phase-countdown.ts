import type { ContestPhase, ContestSummary } from '../api/types';

export function phaseCountdownTarget(
  contest: Pick<
    ContestSummary,
    'phase' | 'submitStartAt' | 'submitEndAt' | 'voteEndAt'
  >,
): Date | null {
  if (contest.phase === 'announce') {
    return new Date(contest.submitStartAt);
  }
  if (contest.phase === 'submit') {
    return new Date(contest.submitEndAt);
  }
  if (contest.phase === 'vote') {
    return new Date(contest.voteEndAt);
  }
  return null;
}

export function formatCountdown(target: Date, now = new Date()): string {
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) return 'soon';
  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/** Full countdown chip copy for announce / submit / vote. Null when closed/cancelled. */
export function phaseCountdownLabel(
  contest: Pick<
    ContestSummary,
    'phase' | 'submitStartAt' | 'submitEndAt' | 'voteEndAt'
  >,
  now = new Date(),
): string | null {
  const target = phaseCountdownTarget(contest);
  if (!target) return null;
  const remaining = formatCountdown(target, now);
  if (contest.phase === 'announce' || contest.phase === 'upcoming') {
    return remaining === 'soon'
      ? 'Opens soon'
      : `Opens in ${remaining}`;
  }
  if (contest.phase === 'submit') {
    return remaining === 'soon'
      ? 'Submit closing soon'
      : `Submit closes in ${remaining}`;
  }
  if (contest.phase === 'vote') {
    return remaining === 'soon'
      ? 'Voting ending soon'
      : `Voting ends in ${remaining}`;
  }
  return null;
}

export function phaseStatusLabel(phase: ContestPhase): string {
  switch (phase) {
    case 'upcoming':
    case 'announce':
      return 'Upcoming';
    case 'submit':
      return 'Submit open';
    case 'vote':
      return 'Voting open';
    case 'closed':
      return 'Results';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Contest';
  }
}

export function phaseStatusStyle(phase: ContestPhase): {
  chipClassName: string;
  textClassName: string;
  iconColor: string;
} {
  switch (phase) {
    case 'upcoming':
    case 'announce':
      return {
        chipClassName: 'bg-[#FFB0CD]',
        textClassName: 'text-[#640039]',
        iconColor: '#640039',
      };
    case 'submit':
      return {
        chipClassName: 'bg-primary-tonal',
        textClassName: 'text-[#3C0091]',
        iconColor: '#3C0091',
      };
    case 'vote':
      return {
        chipClassName: 'bg-[#CCBEFF]',
        textClassName: 'text-[#332664]',
        iconColor: '#332664',
      };
    case 'closed':
      return {
        chipClassName: 'bg-[#E8C47C]/20',
        textClassName: 'text-[#E8C47C]',
        iconColor: '#E8C47C',
      };
    case 'cancelled':
      return {
        chipClassName: 'bg-error-container',
        textClassName: 'text-error',
        iconColor: '#FFB4AB',
      };
    default:
      return {
        chipClassName: 'bg-surface-container-high',
        textClassName: 'text-on-surface-variant',
        iconColor: '#CBC3D7',
      };
  }
}
