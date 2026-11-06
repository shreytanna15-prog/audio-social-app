import { useStudioProjectContextStore } from '@/features/studio/store/studio-project-context.store';

/** Prefer route param; fall back to project-entry store (cleared after read). */
export function resolveStudioProjectId(
  param?: string | string[],
): string | undefined {
  const fromParam = Array.isArray(param) ? param[0] : param;
  if (typeof fromParam === 'string' && fromParam.length > 0) {
    useStudioProjectContextStore.getState().clearProjectId();
    return fromParam;
  }
  return useStudioProjectContextStore.getState().consumeProjectId() ?? undefined;
}
