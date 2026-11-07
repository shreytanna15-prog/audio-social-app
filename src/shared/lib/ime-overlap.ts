import { Dimensions, Platform } from 'react-native';

/**
 * Android edge-to-edge / Gboard often under-reports `endCoordinates.height`.
 * Prefer the larger of height vs screenY-based overlap so bottom actions clear the IME.
 */
export function imeOverlapPx(height: number, screenY: number): number {
  if (Platform.OS !== 'android') {
    return height;
  }
  const screenH = Dimensions.get('screen').height;
  const fromScreenY = Math.max(0, screenH - screenY);
  return Math.max(height, fromScreenY);
}
