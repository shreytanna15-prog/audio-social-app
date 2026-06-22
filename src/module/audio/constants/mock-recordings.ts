import type { AudioRecording } from '@/types/audio';

export const MOCK_RECORDINGS: AudioRecording[] = [
  {
    id: 'rec-1',
    uri: 'file://mock/rec-1.m4a',
    type: 'draft',
    duration: 45,
    path: '/recordings/rec-1/original.m4a',
    createdAt: '2026-06-22T09:15:00.000Z',
    updatedAt: '2026-06-22T09:15:00.000Z',
  },
  {
    id: 'rec-2',
    uri: 'file://mock/rec-2.m4a',
    type: 'draft',
    duration: 92,
    path: '/recordings/rec-2/original.m4a',
    createdAt: '2026-06-21T18:40:00.000Z',
    updatedAt: '2026-06-21T18:42:00.000Z',
  },
  {
    id: 'rec-3',
    uri: 'file://mock/rec-3.m4a',
    type: 'uploaded',
    duration: 28,
    path: '/recordings/rec-3/original.m4a',
    createdAt: '2026-06-20T11:05:00.000Z',
    updatedAt: '2026-06-20T11:05:00.000Z',
  },
];
