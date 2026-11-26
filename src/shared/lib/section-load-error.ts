import { isApiError } from '@/core/api';

export function isSectionNetworkError(error: unknown): boolean {
  if (isApiError(error) && error.code === 'NETWORK_ERROR') {
    return true;
  }
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes('network error') ||
    message.includes('network request failed') ||
    message.includes('failed to fetch') ||
    message.includes('offline')
  );
}

export function getSectionErrorLabel(
  error: unknown,
  offlineLabel: string,
  fallbackLabel: string,
): string {
  return isSectionNetworkError(error) ? offlineLabel : fallbackLabel;
}
