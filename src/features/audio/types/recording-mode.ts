/** Legacy mode ids kept only for reading old saved metadata. */
export type RecordingMode =
  | 'speech'
  | 'instrument'
  | 'mixed'
  | 'raw'
  | 'gate-lab'
  | 'nitro-m4a';

export function isKnownRecordingMode(
  value: string | null | undefined,
): value is RecordingMode {
  return (
    value === 'speech' ||
    value === 'instrument' ||
    value === 'mixed' ||
    value === 'raw' ||
    value === 'gate-lab' ||
    value === 'nitro-m4a'
  );
}
