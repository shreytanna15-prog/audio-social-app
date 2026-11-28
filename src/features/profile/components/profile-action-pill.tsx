import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { Text } from '@/shared/components/ui/text';

export const PROFILE_PILL_HEIGHT = 40;
export const PROFILE_PILL_GAP = 10;

type ProfileActionPillProps = {
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
  tone: 'primary' | 'secondary';
  accessibilityRole?: 'button';
};

export function ProfileActionPill({
  label,
  onPress,
  accessibilityLabel,
  tone,
  accessibilityRole = 'button',
}: ProfileActionPillProps) {
  const isPrimary = tone === 'primary';

  return (
    <Button
      onPress={onPress}
      role={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      variant="text"
      size="sm"
      className={cn(
        'w-full min-w-0 flex-1 items-center justify-center rounded-full',
        isPrimary ? 'shadow-sm shadow-primary/30' : '',
      )}
      style={({ pressed }) => ({
        flexGrow: 1,
        alignSelf: 'stretch',
        height: PROFILE_PILL_HEIGHT,
        borderRadius: PROFILE_PILL_HEIGHT / 2,
        opacity: pressed ? 0.9 : 1,
        borderWidth: 1,
        borderColor: isPrimary
          ? 'rgba(160, 120, 255, 0.45)'
          : 'rgba(255, 255, 255, 0.12)',
      })}>
      <Text
        className="font-sans text-[13px] font-semibold leading-4 tracking-normal"
        style={{ color: isPrimary ? '#D0BCFF' : '#E4E1EA' }}
        numberOfLines={1}>
        {label}
      </Text>
    </Button>
  );
}
