export type GenreAccent = 'primary' | 'secondary';

export type Genre = {
  id: string;
  name: string;
  tagline: string;
  /** BPM readout for pre-selected cards, or a one-word category chip for the rest */
  tag: string;
  accent: GenreAccent;
  selectedByDefault?: boolean;
};

export const GENRES: Genre[] = [
  {
    id: 'pop',
    name: 'Pop',
    tagline: 'Bright, Melodic & Catchy',
    tag: '128 BPM',
    accent: 'primary',
    selectedByDefault: true,
  },
  {
    id: 'hip-hop',
    name: 'Hip-Hop',
    tagline: 'Heavy 808s & Sharp Bars',
    tag: '88 BPM',
    accent: 'secondary',
    selectedByDefault: true,
  },
  {
    id: 'electronic',
    name: 'Electronic',
    tagline: 'Synths, Bass & Club Beats',
    tag: '132 BPM',
    accent: 'primary',
    selectedByDefault: true,
  },
  {
    id: 'indie',
    name: 'Indie',
    tagline: 'Dreamy Guitars & Raw Soul',
    tag: '104 BPM',
    accent: 'primary',
    selectedByDefault: true,
  },
  {
    id: 'bollywood',
    name: 'Bollywood',
    tagline: 'Lyrical Drama & Sitar Riffs',
    tag: 'Cinematic',
    accent: 'primary',
  },
  {
    id: 'classical',
    name: 'Classical',
    tagline: 'Strings, Ragas & Pure Harmony',
    tag: 'Acoustic',
    accent: 'primary',
  },
  {
    id: 'rnb',
    name: 'R&B',
    tagline: 'Velvet Vocals & Late Grooves',
    tag: 'Smooth',
    accent: 'primary',
  },
  {
    id: 'rock',
    name: 'Rock',
    tagline: 'Driving Drums & Overdrive',
    tag: 'Distorted',
    accent: 'primary',
  },
  {
    id: 'folk',
    name: 'Folk',
    tagline: 'Warm Timber & Honest Stories',
    tag: 'Roots',
    accent: 'primary',
  },
  {
    id: 'devotional',
    name: 'Devotional',
    tagline: 'Chants, Hymns & Calm Focus',
    tag: 'Spiritual',
    accent: 'primary',
  },
  {
    id: 'jazz',
    name: 'Jazz',
    tagline: 'Brass Solos & Complex Chords',
    tag: 'Swing',
    accent: 'primary',
  },
  {
    id: 'lofi',
    name: 'Lo-Fi / Ambient',
    tagline: 'Tape Hiss, Vinyl Crackle & Rain',
    tag: 'Chill',
    accent: 'primary',
  },
];