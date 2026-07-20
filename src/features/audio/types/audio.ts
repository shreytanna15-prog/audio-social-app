import type { AppliedEffect } from '@/features/audio/types/applied-effects';

export type AudioRecording = {
    id: string;
    uri: string;
    type: "draft" | "uploaded";
    duration: number;
    path: string;
    sourcePath?: string;
    appliedEffects?: AppliedEffect[];
    createdAt: string;
    updatedAt: string;
}