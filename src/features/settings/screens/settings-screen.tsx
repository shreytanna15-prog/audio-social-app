import Constants from 'expo-constants';
import { type Href, useRouter } from 'expo-router';
import { Linking, ScrollView, View } from 'react-native';

import { useMe } from '@/features/profile';
import { ScreenHeader } from '@/shared/components/layout/screen-header';
import { useFeedbackDialog } from '@/shared/components/ui/feedback-dialog';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

import { SettingsRow } from '../components/settings-row';
import { SettingsSection } from '../components/settings-section';
import { PRIVACY_URL, TERMS_URL } from '../constants';
import { clearAppCache } from '../utils/clear-app-cache';

function appVersionLabel(): string {
  const native = Constants.nativeAppVersion;
  const config = Constants.expoConfig?.version;
  return native || config || '—';
}

export function SettingsScreen() {
  const { push } = useRouter();
  const { guard } = useNavigationGuard();
  const { data: me } = useMe();
  const { confirm, show, showError, dialog } = useFeedbackDialog();

  const genreCount = me?.preferredGenres?.length ?? 0;
  const genresSubtitle =
    genreCount === 0
      ? 'None selected'
      : `${genreCount} selected`;

  const goTo = (href: Href) => {
    guard(() => push(href));
  };

  const openUrl = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        showError('Link unavailable', 'Could not open this page right now.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      showError('Link unavailable', 'Could not open this page right now.');
    }
  };

  const onClearCache = () => {
    confirm(
      'Clear cache?',
      'This frees image cache on this device. Your account and library stay intact.',
      {
        confirmLabel: 'Clear',
        pendingLabel: 'Clearing…',
        onConfirm: async () => {
          try {
            await clearAppCache();
            show({
              title: 'Cache cleared',
              message: 'Image cache was removed from this device.',
            });
          } catch {
            showError('Could not clear cache', 'Try again in a moment.');
            throw new Error('clear-cache-failed');
          }
        },
      },
    );
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Settings" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 px-4 pb-10 pt-4"
        showsVerticalScrollIndicator={false}>
        <SettingsSection title="Taste">
          <SettingsRow
            title="Preferred genres"
            subtitle={genresSubtitle}
            onPress={() =>
              goTo('/(tabs)/profile/settings/genres' as Href)
            }
            showDivider={false}
          />
        </SettingsSection>

        <SettingsSection title="Notifications">
          <SettingsRow
            title="Preferences"
            subtitle="Push alerts for activity"
            onPress={() =>
              goTo('/(tabs)/profile/settings/notifications' as Href)
            }
            showDivider={false}
          />
        </SettingsSection>

        <SettingsSection title="Storage">
          <SettingsRow
            kind="action"
            title="Clear cache"
            subtitle="Free up image cache on this device"
            onPress={onClearCache}
            showDivider={false}
          />
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsRow
            kind="value"
            title="Version"
            value={appVersionLabel()}
          />
          <SettingsRow
            title="Terms of Service"
            onPress={() => {
              void openUrl(TERMS_URL);
            }}
          />
          <SettingsRow
            title="Privacy Policy"
            onPress={() => {
              void openUrl(PRIVACY_URL);
            }}
            showDivider={false}
          />
        </SettingsSection>
      </ScrollView>
      {dialog}
    </View>
  );
}
