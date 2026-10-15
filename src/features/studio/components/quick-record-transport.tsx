import {
  Mic,
  Play,
  Save,
  Scissors,
  Upload,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

const SIDE = 40;
const RECORD = 64;
const SLOT = 56;
const RECORD_SLOT = 68;

type Action = {
  id: string;
  label: string;
  Icon: LucideIcon;
  primary?: boolean;
};

const ACTIONS: Action[] = [
  { id: 'save', label: 'Save', Icon: Save },
  { id: 'play-pause', label: 'Play/Pause', Icon: Play },
  { id: 'record', label: 'Record', Icon: Mic, primary: true },
  { id: 'trim', label: 'Trim', Icon: Scissors },
  { id: 'publish', label: 'Publish', Icon: Upload },
];

export function QuickRecordTransport() {
  return (
    <View className="items-center">
      <View className="flex-row items-center justify-center gap-4">
        {ACTIONS.map(({ id, label, Icon, primary }) => (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={({ pressed }) => [
              styles.slot,
              primary ? styles.recordSlot : null,
              { opacity: pressed ? (primary ? 0.92 : 0.8) : 1 },
            ]}>
            <View style={primary ? styles.recordButton : styles.sideButton}>
              <Icon
                size={primary ? 26 : 17}
                color={primary ? '#3C0091' : '#E4E1EA'}
                strokeWidth={primary ? 2.3 : 2}
              />
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: SLOT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordSlot: {
    width: RECORD_SLOT,
  },
  sideButton: {
    width: SIDE,
    height: SIDE,
    borderRadius: SIDE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.25,
    borderColor: 'rgba(228, 225, 234, 0.5)',
    backgroundColor: 'transparent',
  },
  recordButton: {
    width: RECORD,
    height: RECORD,
    borderRadius: RECORD / 2,
    alignItems: 'center',
    justifyContent: 'center',
    experimental_backgroundImage:
      'linear-gradient(to right, #A078FF 0%, #D0BCFF 50%, #D0BCFF 100%)',
    boxShadow: '0 8px 20px rgba(160, 120, 255, 0.38)',
  },
});
