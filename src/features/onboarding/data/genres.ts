import {
  TRACK_GENRES,
  TRACK_GENRE_LABELS,
  type TrackGenreId,
} from '@/features/tracks/constants/track-genres';

export type GenreAccent = 'primary' | 'secondary';

export type Genre = {
  id: TrackGenreId;
  name: string;
  accent: GenreAccent;
};

/** Max preferred genres for onboarding / PATCH /api/user (publish stays 1–3). */
export const MAX_PREFERRED_GENRES = 6;

/** Same ids/labels as publish + backend TRACK_GENRES. */
export const GENRES: Genre[] = TRACK_GENRES.map((id, index) => ({
  id,
  name: TRACK_GENRE_LABELS[id],
  accent: index % 5 === 1 ? 'secondary' : 'primary',
}));
