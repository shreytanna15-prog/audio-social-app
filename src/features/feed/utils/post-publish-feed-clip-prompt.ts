import type { FeedbackContent } from '@/shared/components/ui/feedback-dialog';

type ShowFeedback = (content: FeedbackContent) => void;

type PostPublishFeedClipPromptOptions = {
  trackId: string;
  onCreate: (trackId: string) => void;
  onSkip?: () => void;
};

/** After a successful publish: opt-in Feed Clip CTA (not a forced trimmer open). */
export function showPostPublishFeedClipPrompt(
  show: ShowFeedback,
  { trackId, onCreate, onSkip }: PostPublishFeedClipPromptOptions,
) {
  show({
    title: 'Published',
    message: 'Make a short Feed Clip for this song?',
    actions: [
      {
        label: 'Not now',
        variant: 'ghost',
        onPress: onSkip,
      },
      {
        label: 'Create Feed Clip',
        variant: 'soft',
        onPress: () => onCreate(trackId),
      },
    ],
  });
}

export function createFeedClipHref(trackId: string) {
  return `/studio/create-feed-clip?trackId=${encodeURIComponent(trackId)}` as const;
}
