import { NativeModules, Platform } from 'react-native';

const { FFmpegKitReactNativeModule } = NativeModules;

export const FFMPEG_UNAVAILABLE_MESSAGE =
  'FFmpeg is not available in this build. Use a development build (npx expo run:android or npx expo run:ios). Expo Go does not include native FFmpeg.';

export function isFfmpegAvailable(): boolean {
  return Platform.OS !== 'web' && FFmpegKitReactNativeModule != null;
}

export function assertFfmpegAvailable(): void {
  if (!isFfmpegAvailable()) {
    throw new Error(FFMPEG_UNAVAILABLE_MESSAGE);
  }
}
