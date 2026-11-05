/** Play should restart from 0 when the playhead sits at/near EOF. */
export function isPlaybackNearEnd(
  currentTime: number,
  duration: number,
  epsilonSeconds = 0.5,
): boolean {
  return duration > 0 && currentTime >= duration - epsilonSeconds;
}
