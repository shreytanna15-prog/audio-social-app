import { useEffect } from 'react';

import { useRecordingsStore } from '@/features/audio/store/recordings.store';

export function useRecordingsHydration(): void {
  const refreshRecordings = useRecordingsStore((state) => state.refreshRecordings);

  useEffect(() => {
    void refreshRecordings();
  }, [refreshRecordings]);
}
