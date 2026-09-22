type AuthInvalidatedListener = () => void;

const listeners = new Set<AuthInvalidatedListener>();

export function onAuthInvalidated(listener: AuthInvalidatedListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitAuthInvalidated(): void {
  for (const listener of listeners) {
    listener();
  }
}
