export type AudioRecording = {
    id: string;
    uri: string;
    type: "draft" | "uploaded";
    duration: number;
    path: string;
    createdAt: string;
    updatedAt: string;
}