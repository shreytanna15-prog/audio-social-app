import { Eye, EyeOff } from 'lucide-react-native';
import { Pressable } from 'react-native';

/**
 * Figma Audio section eye control — toggles draft visibility in the list.
 * Open eye = drafts shown; crossed eye = drafts hidden.
 */
type LibraryAudioVisibilityToggleProps = {
  showDrafts: boolean;
  onChange: (showDrafts: boolean) => void;
};

export function LibraryAudioVisibilityToggle({
  showDrafts,
  onChange,
}: LibraryAudioVisibilityToggleProps) {
  const Icon = showDrafts ? Eye : EyeOff;

  return (
    <Pressable
      onPress={() => onChange(!showDrafts)}
      accessibilityRole="button"
      accessibilityLabel={showDrafts ? 'Hide drafts' : 'Show drafts'}
      accessibilityState={{ selected: showDrafts }}
      hitSlop={6}
      className="h-8 w-8 items-center justify-center rounded-xl"
      style={{
        backgroundColor: '#2A2930',
        borderCurve: 'continuous',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      }}>
      <Icon size={16} color="#D0BCFF" strokeWidth={2} />
    </Pressable>
  );
}
