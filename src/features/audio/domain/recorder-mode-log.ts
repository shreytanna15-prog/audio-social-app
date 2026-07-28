/** Bake-off mode logs retired — keep a simple warn helper for editor play/save. */
export function logRecorderMode(
  tag: 'Recorded' | 'Save' | 'Play',
  detail?: string | null,
): void {
  console.warn(`[${tag}]${detail ? ` ${detail}` : ''}`);
}
