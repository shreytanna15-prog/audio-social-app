import * as Clipboard from 'expo-clipboard';
import { Copy, Share2 } from 'lucide-react-native';
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

type ArtistOptionsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artistName: string;
  username: string;
  bottomOffset: number;
};

export function ArtistOptionsSheet({
  open,
  onOpenChange,
  artistName,
  username,
  bottomOffset,
}: ArtistOptionsSheetProps) {
  const profileLink = `vibeo-gram://artist/${username.replace('@', '')}`;

  const onShare = () => {
    void Share.share({
      message: `Check out ${artistName} (${username}) on VibeOGram`,
    });
    onOpenChange(false);
  };

  const onCopyLink = async () => {
    await Clipboard.setStringAsync(profileLink);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent bottomOffset={bottomOffset} className="bg-[#17171D]">
        <SheetClose />
        <SheetHeader>
          <SheetTitle>{artistName}</SheetTitle>
          <SheetDescription>Share or manage this artist profile.</SheetDescription>
        </SheetHeader>

        <SheetBody>
          <View className="gap-1">
            <Pressable
              onPress={onShare}
              accessibilityRole="button"
              className="flex-row items-center gap-3 rounded-xl px-2 py-3.5 active:bg-white/5">
              <Share2 size={18} color="#D0BCFF" strokeWidth={2} />
              <Text variant="title-md" className="text-on-surface">
                Share profile
              </Text>
            </Pressable>
            <Pressable
              onPress={() => void onCopyLink()}
              accessibilityRole="button"
              className="flex-row items-center gap-3 rounded-xl px-2 py-3.5 active:bg-white/5">
              <Copy size={18} color="#D0BCFF" strokeWidth={2} />
              <Text variant="title-md" className="text-on-surface">
                Copy profile link
              </Text>
            </Pressable>
          </View>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
