import { Pressable, type AccessibilityRole } from 'react-native';

import { Text } from '@/shared/components/ui/text';

/** Locked hero action metrics — keep both pills visually matched. */
export const PROFILE_PILL_HEIGHT = 40;
export const PROFILE_PILL_GAP = 10;

const LABEL =
  'font-sans text-[13px] font-semibold leading-4 tracking-normal';

type ProfileActionPillProps = {
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
  /** Primary = primary tint; secondary = dark glass. */
  tone: 'primary' | 'secondary';
  accessibilityRole?: AccessibilityRole;
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
    <Pressable
      onPress={onPress}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      className="min-w-0 flex-1 items-center justify-center"
      style={({ pressed }) => ({
        height: PROFILE_PILL_HEIGHT,
        borderRadius: PROFILE_PILL_HEIGHT / 2,
        opacity: pressed ? 0.88 : 1,
        // Primary container (#A078FF) at reduced opacity over the dark hero.
        backgroundColor: isPrimary
          ? 'rgba(160, 120, 255, 0.35)'
          : 'rgba(27, 27, 33, 0.85)',
        borderWidth: 1,
        borderColor: isPrimary
          ? 'rgba(160, 120, 255, 0.45)'
          : 'rgba(255, 255, 255, 0.12)',
      })}>
      <Text
        className={LABEL}
        style={{ color: isPrimary ? '#D0BCFF' : '#E4E1EA' }}
        numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}
