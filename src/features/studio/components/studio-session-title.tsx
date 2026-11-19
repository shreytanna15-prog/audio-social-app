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
import { cn } from '@/shared/lib/utils';

type StudioSessionTitleProps = {
  title: string;
  /** Local draft only — caller persists on studio Save. */
  onChangeTitle: (title: string) => void;
  disabled?: boolean;
  dialogTitle?: string;
  placeholder?: string;
};

/**
 * Centered header title + rename dialog. Confirm only updates local draft.
 */
export function StudioSessionTitle({
  title,
  onChangeTitle,
  disabled = false,
  dialogTitle = 'Rename',
  placeholder = 'Untitled',
}: StudioSessionTitleProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(title);

  useEffect(() => {
    if (open) {
      setDraft(title);
    }
  }, [open, title]);

  const commit = () => {
    onChangeTitle(draft.trim() || placeholder);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Rename, current title ${title}`}
        disabled={disabled}
        onPress={() => setOpen(true)}
        className="max-w-full flex-row items-center justify-center gap-1.5 active:opacity-80"
        style={{ opacity: disabled ? 0.5 : 1 }}>
        <Text
          variant="title-md"
          className="shrink text-on-surface"
          numberOfLines={1}>
          {title}
        </Text>
        <Pencil size={11} color="#CBC3D7" strokeWidth={2} />
      </Pressable>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <Input
            value={draft}
            onChangeText={setDraft}
            autoFocus
            selectTextOnFocus
            maxLength={80}
            placeholder={placeholder}
            onSubmitEditing={commit}
            className={cn(
              fieldClassName,
              'rounded-2xl border border-hairline bg-canvas',
            )}
          />
          <DialogFooter>
            <Button variant="ghost" size="sm" onPress={() => setOpen(false)}>
              <Text>Cancel</Text>
            </Button>
            <Button variant="soft" size="sm" onPress={commit}>
              <Text>Confirm</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
