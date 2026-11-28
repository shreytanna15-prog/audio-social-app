import { apiRequest } from '@/core/api';

import type { WalletDto } from './types';

export async function getWallet(params?: {
  cursor?: string;
  limit?: number;
}): Promise<WalletDto> {
  const search = new URLSearchParams();
  if (params?.cursor) search.set('cursor', params.cursor);
  if (params?.limit != null) search.set('limit', String(params.limit));
  const query = search.toString();

  return apiRequest<WalletDto>({
    path: query ? `/api/me/wallet?${query}` : '/api/me/wallet',
    method: 'GET',
  });
}
