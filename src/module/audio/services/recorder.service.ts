import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  type AudioRecorder,
} from "expo-audio";

export const RECORDING_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
  directory: "document" as const,
};

let recorder: AudioRecorder | null = null;

function getRecorder(): AudioRecorder {
  if (!recorder) {
    throw new Error("Audio recorder is not initialized.");
  }

  return recorder;
}

export type StopRecordingResult = {
  uri: string | null;
  durationMillis: number;
};

export const recorderService = {
  bind(next: AudioRecorder | null): void {
    recorder = next;
  },

  async initialize(): Promise<boolean> {
    const status = await AudioModule.requestRecordingPermissionsAsync();

    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: true,
    });

    return status.granted;
  },

  async prepareAndRecord(): Promise<void> {
    const audioRecorder = getRecorder();
    await audioRecorder.prepareToRecordAsync(RECORDING_OPTIONS);
    audioRecorder.record();
  },

  pause(): void {
    getRecorder().pause();
  },

  resume(): void {
    getRecorder().record();
  },

  async stop(): Promise<StopRecordingResult> {
    const audioRecorder = getRecorder();
    const durationMillis = audioRecorder.getStatus().durationMillis;

    await audioRecorder.stop();

    return {
      uri: audioRecorder.uri,
      durationMillis,
    };
  },

  async stopIfActive(): Promise<void> {
    try {
      await getRecorder().stop();
    } catch {
      // recorder may already be stopped
    }
  },
};
