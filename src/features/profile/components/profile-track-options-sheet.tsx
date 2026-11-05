import { Share2 } from 'lucide-react-native';
import { Pressable, Share, View } from 'react-native';

import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet';
import { Text } from '@/shared/components/ui/text';

import type { ProfileTrack } from '../types';

type ProfileTrackOptionsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: ProfileTrack | null;
  profileName: string;
  bottomOffset: number;
  onPlay: (track: ProfileTrack) => void;
};

export function ProfileTrackOptionsSheet({
  open,
  onOpenChange,
  track,
  profileName,
  bottomOffset,
  onPlay,
}: ProfileTrackOptionsSheetProps) {
  const onShare = () => {
    if (!track) return;
    void Share.share({
      message: `${track.title} by ${profileName} on VibeOGram`,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open && !!track} onOpenChange={onOpenChange}>
      <SheetContent bottomOffset={bottomOffset} className="bg-[#17171D]">
        <SheetClose />
        <SheetHeader>
          <SheetTitle>{track?.title ?? 'Track'}</SheetTitle>
          <SheetDescription>
            {track ? `${track.durationLabel} • ${track.playsLabel}` : ''}
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          <View className="gap-1">
            <Pressable
              onPress={() => {
                if (!track) return;
                onPlay(track);
                onOpenChange(false);
              }}
              accessibilityRole="button"
              className="rounded-xl px-2 py-3.5 active:bg-white/5">
              <Text variant="title-md" className="text-on-surface">
                Play track
              </Text>
            </Pressable>
            <Pressable
              onPress={onShare}
              accessibilityRole="button"
              className="flex-row items-center gap-3 rounded-xl px-2 py-3.5 active:bg-white/5">
              <Share2 size={18} color="#D0BCFF" strokeWidth={2} />
              <Text variant="title-md" className="text-on-surface">
                Share track
              </Text>
            </Pressable>
          </View>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
