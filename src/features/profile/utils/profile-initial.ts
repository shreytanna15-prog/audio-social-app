/** First letter for avatar placeholder — name preferred, else username. */
export function profileInitial(
  name: string | null | undefined,
  username: string,
): string {
  const source = (name?.trim() || username.replace(/^@/, '')).trim();
  return source.charAt(0).toUpperCase() || '?';
}
