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

type ArtistNotificationsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bottomOffset: number;
};

/** Local empty-state sheet until notifications API exists. */
export function ArtistNotificationsSheet({
  open,
  onOpenChange,
  bottomOffset,
}: ArtistNotificationsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent bottomOffset={bottomOffset} className="bg-[#17171D]">
        <SheetClose />
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>Updates from artists you follow will show here.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <Text variant="body-md" className="text-on-surface-variant">
            You are all caught up. No new notifications.
          </Text>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
