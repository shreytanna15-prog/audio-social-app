export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RESOURCE_NOT_FOUND'
  | 'CONFLICT'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_SERVER_ERROR'
  | 'VALIDATION_ERROR'
  | 'USERNAME_CHANGE_COOLDOWN'
  | 'USERNAME_TAKEN'
  | 'UPLOAD_NOT_FOUND'
  | 'R2_NOT_CONFIGURED'
  | 'EMAIL_NOT_CONFIGURED'
  | 'EMAIL_SEND_FAILED'
  | 'OTP_INVALID'
  | 'OTP_EXPIRED'
  | 'OTP_LOCKED'
  | 'RESEND_COOLDOWN';

export type ApiSuccess<T> = {
  success: true;
  message: string;
  data?: T;
};

export type ApiErrorBody = {
  success: false;
  code: ApiErrorCode;
  message: string;
};

export type ApiEnvelope<T> = ApiSuccess<T> | ApiErrorBody;

export type AuthMode = 'none' | 'access' | 'refresh';

export type ApiRequestOptions = {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: AuthMode;
  /** Internal: skip 401→refresh→retry (used by refresh itself / already-retried calls). */
  skipAuthRefresh?: boolean;
  headers?: Record<string, string>;
};
