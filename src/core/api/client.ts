import { emitAuthInvalidated } from './auth-events';
import { ApiError } from './errors';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from './token-storage';
import type { ApiEnvelope, ApiErrorBody, ApiRequestOptions, ApiSuccess } from './types';

const DEFAULT_BASE_URL = 'http://localhost:3015';

function getBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL?.trim();
  return url && url.length > 0 ? url.replace(/\/$/, '') : DEFAULT_BASE_URL;
}

let refreshPromise: Promise<void> | null = null;

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    (value as { success: unknown }).success === false
  );
}

function isApiSuccess<T>(value: unknown): value is ApiSuccess<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    (value as { success: unknown }).success === true
  );
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError({
      message: 'Invalid JSON response from server.',
      status: response.status,
      code: 'UNKNOWN',
    });
  }
}

async function refreshSession(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        throw new ApiError({
          message: 'Session expired. Please log in again.',
          status: 401,
          code: 'UNAUTHORIZED',
        });
      }

      const response = await fetch(`${getBaseUrl()}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'x-refresh-token': refreshToken,
        },
      });

      const payload = await parseJson(response);

      if (!response.ok || isApiErrorBody(payload)) {
        await clearTokens();
        emitAuthInvalidated();
        const message =
          isApiErrorBody(payload) && payload.message
            ? payload.message
            : 'Session expired. Please log in again.';
        const code = isApiErrorBody(payload) ? payload.code : 'UNAUTHORIZED';
        throw new ApiError({ message, status: response.status || 401, code });
      }

      if (!isApiSuccess<{ accessToken: string; refreshToken: string }>(payload) || !payload.data) {
        await clearTokens();
        emitAuthInvalidated();
        throw new ApiError({
          message: 'Invalid refresh response.',
          status: response.status,
          code: 'UNKNOWN',
        });
      }

      await setTokens({
        accessToken: payload.data.accessToken,
        refreshToken: payload.data.refreshToken,
      });
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function buildHeaders(options: ApiRequestOptions): Promise<Headers> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const auth = options.auth ?? 'access';

  if (auth === 'access') {
    const accessToken = await getAccessToken();
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  if (auth === 'refresh') {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      headers.set('x-refresh-token', refreshToken);
    }
  }

  return headers;
}

export async function apiRequest<T>(options: ApiRequestOptions): Promise<T> {
  const method = options.method ?? (options.body !== undefined ? 'POST' : 'GET');
  const url = `${getBaseUrl()}${options.path.startsWith('/') ? options.path : `/${options.path}`}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: await buildHeaders(options),
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError({
      message: 'Network error. Check your connection and API URL.',
      status: 0,
      code: 'NETWORK_ERROR',
    });
  }

  const payload = (await parseJson(response)) as ApiEnvelope<T> | null;

  if (
    response.status === 401 &&
    (options.auth ?? 'access') === 'access' &&
    !options.skipAuthRefresh
  ) {
    try {
      await refreshSession();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError({
        message: 'Session expired. Please log in again.',
        status: 401,
        code: 'UNAUTHORIZED',
      });
    }

    return apiRequest<T>({ ...options, skipAuthRefresh: true });
  }

  if (!response.ok || isApiErrorBody(payload)) {
    const message =
      isApiErrorBody(payload) && payload.message
        ? payload.message
        : `Request failed (${response.status}).`;
    const code = isApiErrorBody(payload) ? payload.code : 'UNKNOWN';
    throw new ApiError({ message, status: response.status, code });
  }

  if (!isApiSuccess<T>(payload)) {
    throw new ApiError({
      message: 'Unexpected response from server.',
      status: response.status,
      code: 'UNKNOWN',
    });
  }

  return payload.data as T;
}
