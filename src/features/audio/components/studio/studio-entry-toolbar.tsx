import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

type StudioEntryToolbarProps = {
  disabled?: boolean;
  onQuickRecord: () => void;
  onImportAudio: () => void;
};

export function StudioEntryToolbar({
  disabled = false,
  onQuickRecord,
  onImportAudio,
}: StudioEntryToolbarProps) {
  return (
    <View style={styles.row}>
      <Pressable
        disabled={disabled}
        onPress={onQuickRecord}
        style={({ pressed }) => [
          styles.card,
          disabled && styles.disabled,
          pressed && !disabled && styles.pressed,
        ]}>
        <View style={styles.iconWrap}>
          <SymbolView
            name={{ ios: 'mic.fill', android: 'mic', web: 'mic' }}
            size={22}
            tintColor="#1A73E8"
          />
        </View>
        <Text style={styles.title}>Quick record</Text>
        <Text style={styles.subtitle}>Open studio and record</Text>
      </Pressable>

      <Pressable
        disabled={disabled}
        onPress={onImportAudio}
        style={({ pressed }) => [
          styles.card,
          disabled && styles.disabled,
          pressed && !disabled && styles.pressed,
        ]}>
        <View style={styles.iconWrap}>
          <SymbolView
            name={{
              ios: 'square.and.arrow.down',
              android: 'drive_folder_upload',
              web: 'drive_folder_upload',
            }}
            size={22}
            tintColor="#1A73E8"
          />
        </View>
        <Text style={styles.title}>Import audio</Text>
        <Text style={styles.subtitle}>File becomes layer 1</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    flex: 1,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E9EE',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF2FD',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1D21',
  },
  subtitle: {
    fontSize: 11,
    color: '#7A7F87',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.88,
    backgroundColor: '#F7F9FC',
  },
});
