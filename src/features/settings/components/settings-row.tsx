import { ChevronRight } from 'lucide-react-native';
import { Pressable, Switch, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

type SettingsRowBase = {
  title: string;
  subtitle?: string;
  disabled?: boolean;
  showDivider?: boolean;
};

type SettingsNavRowProps = SettingsRowBase & {
  kind?: 'nav';
  value?: string;
  onPress: () => void;
};

type SettingsSwitchRowProps = SettingsRowBase & {
  kind: 'switch';
  value: boolean;
  onValueChange: (next: boolean) => void;
};

type SettingsValueRowProps = SettingsRowBase & {
  kind: 'value';
  value: string;
};

type SettingsActionRowProps = SettingsRowBase & {
  kind: 'action';
  onPress: () => void;
};

export type SettingsRowProps =
  | SettingsNavRowProps
  | SettingsSwitchRowProps
  | SettingsValueRowProps
  | SettingsActionRowProps;

function RowLabel({
  title,
  subtitle,
  disabled,
}: {
  title: string;
  subtitle?: string;
  disabled: boolean;
}) {
  return (
    <View className="min-w-0 flex-1 gap-0.5">
      <Text
        variant="title-md"
        className={disabled ? 'text-on-surface-variant' : 'text-on-surface'}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="caption" className="text-on-surface-variant">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

function rowClassName(showDivider: boolean) {
  return `flex-row items-center gap-3 px-4 py-3.5 ${
    showDivider ? 'border-b border-white/5' : ''
  }`;
}

export function SettingsRow(props: SettingsRowProps) {
  const disabled = props.disabled ?? false;
  const showDivider = props.showDivider ?? true;

  if (props.kind === 'switch') {
    return (
      <View
        className={rowClassName(showDivider)}
        style={{ opacity: disabled ? 0.5 : 1 }}
        accessibilityState={{ disabled }}>
        <RowLabel
          title={props.title}
          subtitle={props.subtitle}
          disabled={disabled}
        />
        <Switch
          value={props.value}
          disabled={disabled}
          onValueChange={props.onValueChange}
          trackColor={{
            false: 'rgba(255,255,255,0.12)',
            true: 'rgba(160,120,255,0.55)',
          }}
          thumbColor="#FFFFFF"
          accessibilityLabel={props.title}
        />
      </View>
    );
  }

  if (props.kind === 'value') {
    return (
      <View
        className={rowClassName(showDivider)}
        style={{ opacity: disabled ? 0.5 : 1 }}
        accessibilityState={{ disabled }}>
        <RowLabel
          title={props.title}
          subtitle={props.subtitle}
          disabled={disabled}
        />
        <Text variant="body-md" className="text-on-surface-variant">
          {props.value}
        </Text>
      </View>
    );
  }

  const trailing =
    props.kind === 'action' ? (
      <ChevronRight size={18} color="#958EA0" strokeWidth={2} />
    ) : (
      <View className="flex-row items-center gap-2">
        {props.value ? (
          <Text variant="body-md" className="text-on-surface-variant">
            {props.value}
          </Text>
        ) : null}
        <ChevronRight size={18} color="#958EA0" strokeWidth={2} />
      </View>
    );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={props.onPress}
      className={`${rowClassName(showDivider)} active:bg-white/5`}
      style={({ pressed }) => ({
        opacity: disabled ? 0.5 : pressed ? 0.88 : 1,
      })}>
      <RowLabel
        title={props.title}
        subtitle={props.subtitle}
        disabled={disabled}
      />
      {trailing}
    </Pressable>
  );
}
