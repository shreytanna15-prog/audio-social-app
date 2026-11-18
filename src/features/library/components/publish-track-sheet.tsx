import { TrackPublishSheet } from '@/features/tracks/components/track-publish-sheet';

import type { LibraryAudioItem } from '../types';

type PublishTrackSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: LibraryAudioItem | null;
  bottomOffset?: number;
  onPublished?: () => void;
  onError?: (title: string, message: string) => void;
};

/** Library publish entry — cloud backup lives in the track menu; the sheet submits publish. */
export function PublishTrackSheet({
  open,
  onOpenChange,
  track,
  bottomOffset = 12,
  onPublished,
  onError,
}: PublishTrackSheetProps) {
  return (
    <TrackPublishSheet
      open={open}
      onOpenChange={onOpenChange}
      track={track ? { id: track.id, title: track.title } : null}
      bottomOffset={bottomOffset}
      onPublished={onPublished}
      onError={onError}
    />
  );
}
