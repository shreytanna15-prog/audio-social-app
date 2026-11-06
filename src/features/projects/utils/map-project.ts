import type { ProjectDetailDto, ProjectSummaryDto, ProjectTrackDto } from '../api/types';
import type { ProjectDetail, ProjectSummary, ProjectTrack } from '../types';

export function formatRelativeUpdatedAt(iso: string): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) {
    return iso.slice(0, 10);
  }

  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }

  return iso.slice(0, 10);
}

function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function mapProjectSummary(dto: ProjectSummaryDto): ProjectSummary {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    trackCount: dto.trackCount,
    updatedAt: dto.updatedAt,
    createdAt: dto.createdAt,
    updatedLabel: formatRelativeUpdatedAt(dto.updatedAt),
  };
}

export function mapProjectTrack(dto: ProjectTrackDto): ProjectTrack {
  return {
    id: dto.id,
    kind: dto.kind,
    status: dto.status,
    storageState: dto.storageState,
    title: dto.title,
    durationMs: dto.durationMs,
    mixUrl: dto.mixUrl,
    addedAt: dto.addedAt,
    createdAt: dto.createdAt,
    metaLabel: `${formatDuration(dto.durationMs)} · ${formatRelativeUpdatedAt(dto.addedAt)}`,
  };
}

export function mapProjectDetail(dto: ProjectDetailDto): ProjectDetail {
  return {
    ...mapProjectSummary(dto),
    tracks: dto.tracks.map(mapProjectTrack),
  };
}
