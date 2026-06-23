import type { AudioEffectId } from '@/module/audio/types/effects';

export type AudioRecording = {
    id: string;
    uri: string;
    type: "draft" | "uploaded";
    duration: number;
    path: string;
    sourcePath?: string;
    appliedEffects?: AudioEffectId[];
    createdAt: string;
    updatedAt: string;
}