export type TrackKind = 'SINGLE' | 'MULTI';

export type TrackStatus = 'DRAFT' | 'PUBLISHED';

export type TrackStorageState = 'LOCAL_ONLY' | 'SYNCED' | 'CLOUD_ONLY';

export type TrackLayerKind = 'vocal' | 'beat' | 'import';

export type AppliedEffect = {
  id: 'denoise' | 'enhance' | 'reverb' | 'echo' | 'modulate';
  params: Record<string, string | number | boolean>;
};

export type TrackRecord = {
  id: string;
  kind: TrackKind;
  status: TrackStatus;
  storageState?: TrackStorageState;
  title: string;
  durationMs: number;
  mixPath: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TrackLayerRecord = {
  id: string;
  sortIndex: number;
  kind: TrackLayerKind;
  name: string;
  stemPath: string | null;
  sourcePath: string | null;
  offsetMs: number;
  durationMs: number;
  muted: boolean;
  appliedEffects: AppliedEffect[];
  peaks: number[] | null;
  createdAt: string;
  updatedAt: string;
};

export type TrackDocument = TrackRecord & {
  layers: TrackLayerRecord[];
};

export type TrackListItem = {
  id: string;
  kind: TrackKind;
  status: TrackStatus;
  storageState: TrackStorageState;
  title: string;
  durationMs: number;
  mixUrl: string | null;
  coverUrl: string | null;
  playCount: number;
  feedClipId?: string | null;
  publishedAt: string | null;
  createdAt: string;
};

export type TrackDetail = {
  id: string;
  kind: TrackKind;
  status: TrackStatus;
  storageState: TrackStorageState;
  title: string;
  durationMs: number;
  mixUrl: string | null;
  coverUrl: string | null;
  caption: string | null;
  description: string | null;
  genres: string[];
  keywords: string[];
  playCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  layers: TrackLayerDetail[];
};

export type TrackLayerDetail = {
  id: string;
  sortIndex: number;
  kind: TrackLayerKind;
  name: string;
  stemUrl: string | null;
  sourceUrl: string | null;
  offsetMs: number;
  durationMs: number;
  muted: boolean;
  appliedEffects: AppliedEffect[];
  peaks: number[] | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateTrackLayerRequest = {
  id: string;
  kind: TrackLayerKind;
  name: string;
  durationMs: number;
  offsetMs?: number;
  muted?: boolean;
  sortIndex?: number;
  appliedEffects?: AppliedEffect[];
  peaks?: number[];
};

export type CreateTrackRequest = {
  id: string;
  kind: TrackKind;
  title: string;
  durationMs: number;
  layers: CreateTrackLayerRequest[];
  projectId?: string;
};

export type CoverContentType = 'image/jpeg' | 'image/png' | 'image/webp';

export type CoverUploadUrlResponse = {
  path: string;
  signedUrl: string;
  token?: string;
};

export type CoverCompleteResponse = {
  path: string;
  coverUrl: string | null;
};

export type PublishTrackRequest = {
  caption?: string | null;
  description?: string | null;
  genres: string[];
  keywords?: string[];
};

export type PublishedTrackItem = {
  id: string;
  kind: TrackKind;
  title: string;
  caption: string | null;
  description: string | null;
  genres: string[];
  keywords: string[];
  durationMs: number;
  mixUrl: string | null;
  coverUrl: string | null;
  playCount: number;
  publishedAt: string | null;
  createdAt: string;
};

export type UnpublishTrackResponse = {
  id: string;
  status: TrackStatus;
};

export type UpdateTrackRequest = {
  title?: string;
  durationMs?: number;
  layers?: CreateTrackLayerRequest[];
};

export type CreateTrackResponse = {
  id: string;
};

export type SignedUpload = {
  path: string;
  signedUrl: string;
  token: string;
};

export type BackupUploadUrlsResponse = {
  trackId: string;
  uploads: {
    mix: SignedUpload;
    stems: Array<{ layerId: string; upload: SignedUpload }>;
    sources?: Array<{ layerId: string; upload: SignedUpload }>;
  };
};

export type BackupCompleteResponse = {
  id: string;
  storageState: TrackStorageState;
};

export function toTrackListItem(
  track: TrackRecord,
  mixUrl: string | null,
  coverUrl: string | null = null,
  playCount = 0,
): TrackListItem {
  return {
    id: track.id,
    kind: track.kind,
    status: track.status,
    storageState: track.storageState ?? 'LOCAL_ONLY',
    title: track.title,
    durationMs: track.durationMs,
    mixUrl,
    coverUrl,
    playCount,
    publishedAt: track.publishedAt,
    createdAt: track.createdAt,
  };
}
