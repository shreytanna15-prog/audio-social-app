function getTimeOfDayGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

type HomeGreetingProps = {
  name?: string;
};

<<<<<<< Updated upstream
export function getHomeGreeting(name = 'Maya'): string {
  return `${getTimeOfDayGreeting()}, ${name}`;
=======
export function getHomeGreeting(name = 'there', date = new Date()): string {
  const bucket = getGreetingBucket(date);
  const lines =
    bucket === 'morning'
      ? MORNING
      : bucket === 'afternoon'
        ? AFTERNOON
        : bucket === 'evening'
          ? EVENING
          : NIGHT;
  return `${pickLine(lines, date)}, ${name}`;
>>>>>>> Stashed changes
}

export type { HomeGreetingProps };
