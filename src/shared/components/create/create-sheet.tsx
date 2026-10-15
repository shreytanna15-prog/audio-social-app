import { AudioLines, FileUp, FolderPlus, Mic } from 'lucide-react-native';

import { CreateOptionRow } from '@/shared/components/create/create-option-row';
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet';

export type CreateActionId =
  | 'quick-record'
  | 'import-audio'
  | 'multitrack-studio'
  | 'create-project';

type CreateSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Distance from screen bottom to clear the tab bar. */
  bottomOffset: number;
  onSelect?: (action: CreateActionId) => void;
};

const OPTIONS: {
  id: CreateActionId;
  title: string;
  description: string;
  Icon: typeof Mic;
}[] = [
  {
    id: 'quick-record',
    title: 'Quick Record',
    description: 'Record a vocal or instrument.',
    Icon: Mic,
  },
  {
    id: 'import-audio',
    title: 'Import Audio',
    description: 'Bring in audio to edit.',
    Icon: FileUp,
  },
  {
    id: 'multitrack-studio',
    title: 'Multitrack Studio',
    description: 'Record and arrange multiple layers.',
    Icon: AudioLines,
  },
  {
    id: 'create-project',
    title: 'Create Project',
    description: 'Organize related audio work.',
    Icon: FolderPlus,
  },
];

export function CreateSheet({
  open,
  onOpenChange,
  bottomOffset,
  onSelect,
}: CreateSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent bottomOffset={bottomOffset} className="bg-[#17171D]">
        <SheetClose />
        <SheetHeader>
          <SheetTitle>Create something</SheetTitle>
          <SheetDescription>Record, edit, or build your next track.</SheetDescription>
        </SheetHeader>

        <SheetBody>
          {OPTIONS.map((option) => (
            <CreateOptionRow
              key={option.id}
              title={option.title}
              description={option.description}
              Icon={option.Icon}
              onPress={() => {
                onSelect?.(option.id);
                onOpenChange(false);
              }}
            />
          ))}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
