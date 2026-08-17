import { useNavigation, useRouter } from 'expo-router';
import { useCallback } from 'react';

/**
 * Opens the editor for a saved recording, at most once per visit to the list.
 *
 * The list stays mounted and tappable underneath the editor for the whole push
 * transition, so repeat taps would otherwise stack duplicate editor screens.
 * Focus is the authoritative signal: it flips the moment the first push is
 * committed and returns on the way back, so unlike a timed lock it can neither
 * expire too early nor leave the rows permanently dead if a push is swallowed.
 */
export function useOpenRecordingEditor(): (recordingId: string) => void {
  const router = useRouter();
  const navigation = useNavigation();

  return useCallback(
    (recordingId: string) => {
      if (!navigation.isFocused()) {
        return;
      }

      router.push({
        pathname: '/audio/recording/[id]',
        params: { id: recordingId },
      });
    },
    [navigation, router],
  );
}
