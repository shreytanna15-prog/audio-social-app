import { Camera, ImageIcon, Trash2 } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

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

type ProfileMediaSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  canRemove: boolean;
  onTakePhoto: () => void;
  onChooseGallery: () => void;
  onRemove: () => void;
};

export function ProfileMediaSheet({
  open,
  onOpenChange,
  title,
  canRemove,
  onTakePhoto,
  onChooseGallery,
  onRemove,
}: ProfileMediaSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent bottomOffset={12} className="bg-[#17171D]">
        <SheetClose />
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Update your photo</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <View className="gap-1">
            <Pressable
              onPress={onTakePhoto}
              accessibilityRole="button"
              className="flex-row items-center gap-3 rounded-xl px-2 py-3.5 active:bg-white/5">
              <Camera size={18} color="#D0BCFF" strokeWidth={2} />
              <Text variant="title-md" className="text-on-surface">
                Take photo
              </Text>
            </Pressable>
            <Pressable
              onPress={onChooseGallery}
              accessibilityRole="button"
              className="flex-row items-center gap-3 rounded-xl px-2 py-3.5 active:bg-white/5">
              <ImageIcon size={18} color="#D0BCFF" strokeWidth={2} />
              <Text variant="title-md" className="text-on-surface">
                Choose from gallery
              </Text>
            </Pressable>
            {canRemove ? (
              <Pressable
                onPress={onRemove}
                accessibilityRole="button"
                className="flex-row items-center gap-3 rounded-xl px-2 py-3.5 active:bg-white/5">
                <Trash2 size={18} color="#FFB4AB" strokeWidth={2} />
                <Text variant="title-md" className="text-error">
                  Remove
                </Text>
              </Pressable>
            ) : null}
          </View>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
