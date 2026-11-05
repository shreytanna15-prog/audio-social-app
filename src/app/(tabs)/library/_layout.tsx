import { Stack } from 'expo-router';

import { useRecordingsHydration } from '@/features/audio/hooks/use-recordings-hydration';

export default function LibraryLayout() {
  useRecordingsHydration();

  return <Stack screenOptions={{ headerShown: false }} />;
}
