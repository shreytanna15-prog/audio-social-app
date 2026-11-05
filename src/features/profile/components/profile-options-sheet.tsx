import * as Clipboard from 'expo-clipboard';
import { Copy, LogOut, Share2 } from 'lucide-react-native';
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

type ProfileOptionsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileName: string;
  username: string;
  bottomOffset: number;
  /** When set (my profile), show Log out. */
  onLogout?: () => void;
};

export function ProfileOptionsSheet({
  open,
  onOpenChange,
  profileName,
  username,
  bottomOffset,
  onLogout,
}: ProfileOptionsSheetProps) {
  const profileLink = `vibeo-gram://artist/${username.replace('@', '')}`;

  const onShare = () => {
    void Share.share({
      message: `Check out ${profileName} (${username}) on VibeOGram`,
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
          <SheetTitle>{profileName}</SheetTitle>
          <SheetDescription>
            {onLogout ? 'Share or manage your profile.' : 'Share or manage this profile.'}
          </SheetDescription>
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
            {onLogout ? (
              <Pressable
                onPress={() => {
                  onOpenChange(false);
                  onLogout();
                }}
                accessibilityRole="button"
                className="flex-row items-center gap-3 rounded-xl px-2 py-3.5 active:bg-white/5">
                <LogOut size={18} color="#FFB4AB" strokeWidth={2} />
                <Text variant="title-md" className="text-destructive">
                  Log out
                </Text>
              </Pressable>
            ) : null}
          </View>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
