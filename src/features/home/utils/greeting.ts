const MORNING = [
  'Ready to lay down a take',
  'Fresh ears for a new session',
  "Let's find today's tempo",
  'Warm up those vocals',
  'Coffee on, cans on, create',
] as const;

const AFTERNOON = [
  'Keep the groove going',
  'Midday mix energy',
  'Drop into the pocket',
  'Another pass on the hook',
  'Soundcheck the afternoon',
] as const;

const EVENING = [
  'Golden-hour sessions hit different',
  'Dim the lights, up the gain',
  'Evening write mode unlocked',
  'Soft light, loud ideas',
  'Wind down with a melody',
] as const;

const NIGHT = [
  'Late-night booth vibes',
  'After-hours inspiration loading',
  'Quiet room, big sounds',
  'Night owl playlist energy',
  'One more take before sleep',
] as const;

type GreetingBucket = 'morning' | 'afternoon' | 'evening' | 'night';

function getGreetingBucket(date: Date): GreetingBucket {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const now = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((now - start) / 86_400_000);
}

function pickLine(lines: readonly string[], date: Date): string {
  return lines[dayOfYear(date) % lines.length]!;
}

type HomeGreetingProps = {
  name?: string;
};

export function getHomeGreetingParts(name = 'there', date = new Date()) {
  const bucket = getGreetingBucket(date);
  const lines =
    bucket === 'morning'
      ? MORNING
      : bucket === 'afternoon'
        ? AFTERNOON
        : bucket === 'evening'
          ? EVENING
          : NIGHT;
  return { phrase: pickLine(lines, date), name };
}

export function getHomeGreeting(name = 'there', date = new Date()): string {
  const { phrase, name: displayName } = getHomeGreetingParts(name, date);
  return `${phrase}, ${displayName}`;
}

export type { HomeGreetingProps };
