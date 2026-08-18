import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '@/core/theme/use-theme';

type IconButtonProps = {
  icon: SymbolViewProps['name'];
  onPress?: () => void;
  onPressIn?: () => void;
  size?: number;
  color?: string;
  variant?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
};

export function IconButton({
  icon,
  onPress,
  onPressIn,
  size = 22,
  color,
  variant = 'default',
  disabled = false,
  style,
}: IconButtonProps) {
  const theme = useTheme();
  const tintColor = color ?? (variant === 'primary' ? '#ffffff' : theme.text);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'danger' && styles.danger,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      <SymbolView name={icon} size={size} tintColor={tintColor} weight="semibold" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8EAED',
  },
  primary: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E53935',
  },
  danger: {
    backgroundColor: '#FFEBEE',
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.75,
  },
});
