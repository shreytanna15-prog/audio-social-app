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
  };
};

export type BackupCompleteResponse = {
  id: string;
  storageState: TrackStorageState;
};

export function toTrackListItem(
  track: TrackRecord,
  mixUrl: string | null,
): TrackListItem {
  return {
    id: track.id,
    kind: track.kind,
    status: track.status,
    storageState: track.storageState ?? 'LOCAL_ONLY',
    title: track.title,
    durationMs: track.durationMs,
    mixUrl,
    createdAt: track.createdAt,
  };
}
