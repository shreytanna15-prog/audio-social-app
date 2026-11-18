import { Eye, EyeOff } from 'lucide-react-native';
import { Pressable } from 'react-native';

/**
 * Toggles draft visibility in the Audio list.
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
      className="h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-surface-container-highest"
      style={{
        borderCurve: 'continuous',
      }}>
      <Icon size={18} color="#D0BCFF" strokeWidth={2} />
    </Pressable>
  );
}
