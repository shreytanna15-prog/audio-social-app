import { type Href, type Router } from 'expo-router';

import { useStudioProjectContextStore } from '@/features/studio/store/studio-project-context.store';

type LeaveRouter = Pick<
  Router,
  'back' | 'canGoBack' | 'dismissTo' | 'replace'
>;

type LeaveStudioOptions = {
  /**
   * When leaving from a nested studio screen (e.g. Quick Record edit after save),
   * pop through intermediate studio screens straight to the project.
   */
  unwindToProject?: boolean;
};

function projectHref(projectId: string): Href {
  return {
    pathname: '/projects/[id]',
    params: { id: projectId },
  };
}

/**
 * Exit studio (Discard / save done).
 *
 * Discard from Projects → Quick Record must `back()` to the project.
 * Never `dismissTo('/(tabs)')` first — that skips the project and looks like Home.
 */
export function leaveStudioSession(
  router: LeaveRouter,
  projectId?: string | null,
  options?: LeaveStudioOptions,
) {
  const targetId =
    (typeof projectId === 'string' && projectId.length > 0
      ? projectId
      : null) ?? useStudioProjectContextStore.getState().projectId;

  useStudioProjectContextStore.getState().clearProjectId();

  if (targetId && options?.unwindToProject) {
    router.dismissTo(projectHref(targetId));
    return;
  }

  if (router.canGoBack()) {
    router.back();
    return;
  }

  if (targetId) {
    router.replace(projectHref(targetId));
    return;
  }

  router.replace('/(tabs)' as Href);
}
