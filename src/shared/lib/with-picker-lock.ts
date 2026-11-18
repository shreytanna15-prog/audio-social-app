/**
 * Ensures only one native document/image picker is open at a time.
 * Rapid re-entry returns null (or the provided idle value) instead of
 * throwing Expo/Android "document picking in progress" errors.
 */
let pickerInFlight: Promise<unknown> | null = null;

export async function withPickerLock<T>(
  run: () => Promise<T>,
  idleValue: T,
): Promise<T> {
  if (pickerInFlight) {
    return idleValue;
  }

  const task = (async () => run())();
  pickerInFlight = task;
  try {
    return await task;
  } finally {
    if (pickerInFlight === task) {
      pickerInFlight = null;
    }
  }
}

export function isPickerInFlight(): boolean {
  return pickerInFlight != null;
}
