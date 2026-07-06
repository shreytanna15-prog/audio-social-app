import { FFmpegKit } from '@wokcito/ffmpeg-kit-react-native';

const filterAvailabilityCache = new Map<string, boolean>();

export async function isFfmpegFilterAvailable(filterName: string): Promise<boolean> {
  const cached = filterAvailabilityCache.get(filterName);

  if (cached != null) {
    return cached;
  }

  const session = await FFmpegKit.executeWithArguments(['-hide_banner', '-filters']);
  const output = (await session.getOutput()) ?? '';
  const available = new RegExp(`\\b${filterName}\\b`).test(output);

  filterAvailabilityCache.set(filterName, available);
  return available;
}
