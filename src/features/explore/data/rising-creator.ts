export type RisingCreator = {
  id: string;
  name: string;
  role: string;
  meta: string;
  avatarUrl: string;
  badgeLabel?: string;
  spikeLabel?: string;
  sampleTitle?: string;
  verified?: boolean;
};

export const RISING_CREATOR: RisingCreator = {
  id: 'aura-mist',
  name: 'Aura Mist',
  role: 'Electronic Vocalist & Synth Artist',
  meta: "Debut EP: 'Luminous Drift' • 6 Stem Packs",
  avatarUrl:
    'https://images.unsplash.com/photo-1534528741775-53994d69daeb?w=400&h=400&fit=crop&crop=faces',
  badgeLabel: 'RISING CREATOR OF THE WEEK',
  spikeLabel: '+340% SPIKE',
  sampleTitle: 'Luminous Drift',
  verified: true,
};
