import { queryClient } from '@/core/api';
import { useMessageStore } from '@/features/message/store/message.store';
import { usePlayerStore } from '@/features/player/store/player.store';

/**
 * Drop in-memory user data so account switches never show the previous user.
 * Call on logout and before marking a new session authenticated.
 */
export function resetClientSession() {
  queryClient.clear();
  usePlayerStore.getState().clear();
  useMessageStore.getState().setSearchQuery('');
}
