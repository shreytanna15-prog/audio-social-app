import type { PropsWithChildren } from 'react';

import { AudioSessionContext } from '@/module/audio/context/audio-session-context';
import { useRecorderSession } from '@/module/audio/hooks/use-recorder-session';

export function AudioSessionProvider({ children }: PropsWithChildren) {
  const session = useRecorderSession();

  return (
    <AudioSessionContext.Provider value={session}>
      {children}
    </AudioSessionContext.Provider>
  );
}
