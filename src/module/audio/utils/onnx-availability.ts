import { NativeModules, Platform } from 'react-native';

const { Onnxruntime } = NativeModules;

export const ONNX_RUNTIME_UNAVAILABLE_MESSAGE =
  'ONNX Runtime is not available in this build. Use a development build (npx expo run:android or npx expo run:ios).';

export function isOnnxRuntimeAvailable(): boolean {
  return Platform.OS !== 'web' && Onnxruntime != null;
}

export function assertOnnxRuntimeAvailable(): void {
  if (!isOnnxRuntimeAvailable()) {
    throw new Error(ONNX_RUNTIME_UNAVAILABLE_MESSAGE);
  }
}
