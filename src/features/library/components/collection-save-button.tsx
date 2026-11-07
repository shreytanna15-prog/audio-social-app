import { Button } from '@/shared/components/ui/button';
import { Text } from '@/shared/components/ui/text';

type CollectionSaveButtonProps = {
  isSaved: boolean;
  isPending?: boolean;
  onPress: () => void;
};

export function CollectionSaveButton({
  isSaved,
  isPending = false,
  onPress,
}: CollectionSaveButtonProps) {
  return (
    <Button
      variant={isSaved ? 'secondary' : 'soft'}
      disabled={isPending}
      onPress={onPress}
      accessibilityLabel={isSaved ? 'Remove from saved' : 'Save to library'}>
      <Text>{isSaved ? 'Saved' : 'Save'}</Text>
    </Button>
  );
}
