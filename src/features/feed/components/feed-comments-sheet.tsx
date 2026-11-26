import { Dimensions, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlayerComments } from '@/features/player/components/player-comments';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet';

type FeedCommentsSheetProps = {
  open: boolean;
  trackId: string | null;
  commentCount?: number;
  onClose: () => void;
};

const HALF_SCREEN = Math.round(Dimensions.get('window').height * 0.5);

export function FeedCommentsSheet({
  open,
  trackId,
  commentCount,
  onClose,
}: FeedCommentsSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}>
      <SheetContent
        useModal
        showHandle
        bottomOffset={Math.max(insets.bottom, 8)}
        className="px-3 pb-3 pt-2"
        style={{ height: HALF_SCREEN, maxHeight: HALF_SCREEN }}>
        <SheetHeader className="px-1 pb-1">
          <SheetTitle>
            {typeof commentCount === 'number'
              ? `Comments (${commentCount})`
              : 'Comments'}
          </SheetTitle>
        </SheetHeader>
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          contentContainerStyle={{ paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}>
          <View className="px-1">
            {trackId ? (
              <PlayerComments
                trackId={trackId}
                commentCount={commentCount}
                variant="sheet"
              />
            ) : null}
          </View>
        </ScrollView>
      </SheetContent>
    </Sheet>
  );
}
