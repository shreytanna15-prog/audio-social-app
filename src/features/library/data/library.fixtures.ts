import type { LibraryAlbumItem, LibraryPlaylistItem } from '../types';

/** Cover art for library fixtures — kept local (no profile feature import). */
const LIBRARY_COVERS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop',
] as const;

export const LIBRARY_ALBUM_ITEMS: LibraryAlbumItem[] = [
  {
    id: 'lib-album-1',
    title: 'Midnight Echoes',
    trackCount: 8,
    coverUrl: LIBRARY_COVERS[0],
  },
  {
    id: 'lib-album-2',
    title: 'Acoustic Sessions',
    trackCount: 5,
    coverUrl: LIBRARY_COVERS[1],
  },
  {
    id: 'lib-album-3',
    title: 'Neon Horizons Deluxe',
    trackCount: 10,
    coverUrl: LIBRARY_COVERS[2],
  },
  {
    id: 'lib-album-4',
    title: 'After the Rain',
    trackCount: 6,
    coverUrl: LIBRARY_COVERS[3],
  },
];

export const LIBRARY_PLAYLIST_ITEMS: LibraryPlaylistItem[] = [
  {
    id: 'lib-pl-1',
    title: 'Late Night Vibes',
    trackCount: 18,
    coverUrl: LIBRARY_COVERS[0],
    visibility: 'private',
  },
  {
    id: 'lib-pl-2',
    title: 'Indie Discoveries',
    trackCount: 24,
    coverUrl: LIBRARY_COVERS[1],
    visibility: 'public',
  },
  {
    id: 'lib-pl-3',
    title: 'Acoustic Favorites',
    trackCount: 12,
    coverUrl: LIBRARY_COVERS[2],
    visibility: 'private',
  },
  {
    id: 'lib-pl-4',
    title: 'On Repeat',
    trackCount: 30,
    coverUrl: LIBRARY_COVERS[3],
    visibility: 'public',
  },
];
