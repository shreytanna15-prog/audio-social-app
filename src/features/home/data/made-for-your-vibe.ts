export type VibeTrackTagTone = 'purple' | 'pink';

export type VibeTrack = {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  bpm: number;
  key: string;
  primaryTag: string;
  secondaryTag?: string;
  primaryTagTone?: VibeTrackTagTone;
};

export const MADE_FOR_YOUR_VIBE: VibeTrack[] = [
  {
    id: '1',
    title: 'Starlight Memory',
    artist: 'Kaelen Voss ft. Arcaic',
    coverUrl:
      'https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=600&h=600&fit=crop',
    bpm: 118,
    key: 'F# Min',
    primaryTag: 'Deep Groove',
    secondaryTag: 'Original Vocals',
    primaryTagTone: 'purple',
  },
  {
    id: '2',
    title: 'Luminescence',
    artist: 'SOMA Waves',
    coverUrl:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=600&fit=crop',
    bpm: 94,
    key: 'A Min',
    primaryTag: 'Remixable',
    secondaryTag: 'Stem Pack',
    primaryTagTone: 'pink',
  },
  {
    id: '3',
    title: 'Midnight Circuit',
    artist: 'Nova Blake',
    coverUrl:
      'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=600&h=600&fit=crop',
    bpm: 126,
    key: 'D Maj',
    primaryTag: 'Late Night',
    secondaryTag: 'Instrumental',
    primaryTagTone: 'purple',
  },
  {
    id: '4',
    title: 'Velvet Static',
    artist: 'Luna Reed',
    coverUrl:
      'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&h=600&fit=crop',
    bpm: 102,
    key: 'Bb Min',
    primaryTag: 'Alt-R&B',
    secondaryTag: 'Live Take',
    primaryTagTone: 'pink',
  },
  {
    id: '5',
    title: 'Neon Afterglow',
    artist: 'Jax Orion',
    coverUrl:
      'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=600&h=600&fit=crop',
    bpm: 140,
    key: 'E Min',
    primaryTag: 'Trap Soul',
    secondaryTag: 'Original Vocals',
    primaryTagTone: 'purple',
  },
  {
    id: '6',
    title: 'Soft Distortion',
    artist: 'Echo Park',
    coverUrl:
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&h=600&fit=crop',
    bpm: 88,
    key: 'C Min',
    primaryTag: 'Lo-Fi',
    secondaryTag: 'Collab Ready',
    primaryTagTone: 'pink',
  },
];
