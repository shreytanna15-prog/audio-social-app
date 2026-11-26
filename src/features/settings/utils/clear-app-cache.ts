import { Image } from 'expo-image';

/** Clears expo-image memory + disk caches only (not React Query / auth). */
export async function clearAppCache(): Promise<void> {
  await Promise.all([Image.clearMemoryCache(), Image.clearDiskCache()]);
}
