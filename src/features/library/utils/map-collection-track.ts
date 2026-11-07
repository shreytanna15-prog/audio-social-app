import { formatDuration } from '@/features/audio/utils/format';
import type { PlayerTrack } from '@/features/player';

import type { CollectionTrackRowItem } from '../components/collection-track-row';

type CollectionTrackSource = {
  id: string;
  title: string;
  available: boolean;
  durationMs?: number;
  coverUrl?: string | null;
  artist?: { username: string; name: string | null };
};

const UNKNOWN_ARTIST = 'Unknown artist';

function artistLabel(track: CollectionTrackSource): string {
  return track.artist?.name ?? track.artist?.username ?? UNKNOWN_ARTIST;
}

export function mapCollectionTrackToRow(
  track: CollectionTrackSource,
): CollectionTrackRowItem {
  const duration =
    track.durationMs != null ? formatDuration(track.durationMs / 1000) : null;
  const artist = artistLabel(track);

  return {
    id: track.id,
    title: track.title,
    subtitle: duration ? `${artist} · ${duration}` : artist,
    coverUrl: track.coverUrl ?? null,
    available: track.available,
  };
}

export function mapCollectionTrackToPlayerTrack(
  track: CollectionTrackSource,
  fallbackCoverUrl: string | null,
): PlayerTrack {
  return {
    id: track.id,
    title: track.title,
    artist: artistLabel(track),
    coverUrl: track.coverUrl ?? fallbackCoverUrl ?? '',
    durationSec:
      track.durationMs != null ? Math.round(track.durationMs / 1000) : undefined,
  };
}
