import { Pencil } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';

import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { fieldClassName } from '@/shared/components/ui/field-styles';
import { Input } from '@/shared/components/ui/input';
import { Text } from '@/shared/components/ui/text';

import { DEFAULT_QUICK_RECORD_TITLE } from '@/features/studio/store/quick-record.store';

type QuickRecordTitlePillProps = {
  title: string;
  onChangeTitle: (title: string) => void;
  disabled?: boolean;
};

/** Tappable take title + rename dialog (capture and edit). */
export function QuickRecordTitlePill({
  title,
  onChangeTitle,
  disabled = false,
}: QuickRecordTitlePillProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(title);

  useEffect(() => {
    if (open) {
      setDraft(title);
    }
  }, [open, title]);

  const commit = () => {
    onChangeTitle(draft.trim() || DEFAULT_QUICK_RECORD_TITLE);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Rename take, current title ${title}`}
        disabled={disabled}
        onPress={() => setOpen(true)}
        className="max-w-[55%] flex-row items-center gap-1.5 rounded-full border border-white/10 bg-surface-container px-3 py-1.5 active:opacity-80"
        style={{ opacity: disabled ? 0.5 : 1 }}>
        <Text variant="label-sm" className="shrink text-on-surface" numberOfLines={1}>
          {title}
        </Text>
        <Pencil size={10} color="#CBC3D7" strokeWidth={2} />
      </Pressable>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename take</DialogTitle>
          </DialogHeader>
          <Input
            value={draft}
            onChangeText={setDraft}
            autoFocus
            selectTextOnFocus
            maxLength={80}
            placeholder={DEFAULT_QUICK_RECORD_TITLE}
            onSubmitEditing={commit}
            className={fieldClassName}
          />
          <DialogFooter>
            <Button variant="ghost" size="sm" onPress={() => setOpen(false)}>
              <Text>Cancel</Text>
            </Button>
            <Button variant="soft" size="sm" onPress={commit}>
              <Text>Save</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
