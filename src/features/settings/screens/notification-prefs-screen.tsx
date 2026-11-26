import { ScrollView, View } from 'react-native';

import { ScreenHeader } from '@/shared/components/layout/screen-header';
import { Text } from '@/shared/components/ui/text';

import { SettingsRow } from '../components/settings-row';
import { SettingsSection } from '../components/settings-section';
import { useNotificationPrefsStore } from '../store/notification-prefs.store';

export function NotificationPrefsScreen() {
  const masterPush = useNotificationPrefsStore((s) => s.masterPush);
  const likes = useNotificationPrefsStore((s) => s.likes);
  const comments = useNotificationPrefsStore((s) => s.comments);
  const follows = useNotificationPrefsStore((s) => s.follows);
  const messages = useNotificationPrefsStore((s) => s.messages);
  const setMasterPush = useNotificationPrefsStore((s) => s.setMasterPush);
  const setLikes = useNotificationPrefsStore((s) => s.setLikes);
  const setComments = useNotificationPrefsStore((s) => s.setComments);
  const setFollows = useNotificationPrefsStore((s) => s.setFollows);
  const setMessages = useNotificationPrefsStore((s) => s.setMessages);

  const childrenDisabled = !masterPush;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Notifications" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 px-4 pb-10 pt-4"
        showsVerticalScrollIndicator={false}>
        <Text variant="body-md" className="px-1 text-on-surface-variant">
          Preferences stay on this device for now. Push delivery wiring comes
          later.
        </Text>

        <SettingsSection title="Push">
          <SettingsRow
            kind="switch"
            title="Allow notifications"
            subtitle="Master switch for push alerts"
            value={masterPush}
            onValueChange={setMasterPush}
            showDivider={false}
          />
        </SettingsSection>

        <SettingsSection title="Activity">
          <SettingsRow
            kind="switch"
            title="Likes"
            value={likes}
            disabled={childrenDisabled}
            onValueChange={setLikes}
          />
          <SettingsRow
            kind="switch"
            title="Comments"
            value={comments}
            disabled={childrenDisabled}
            onValueChange={setComments}
          />
          <SettingsRow
            kind="switch"
            title="Follows"
            value={follows}
            disabled={childrenDisabled}
            onValueChange={setFollows}
          />
          <SettingsRow
            kind="switch"
            title="Messages"
            value={messages}
            disabled={childrenDisabled}
            onValueChange={setMessages}
            showDivider={false}
          />
        </SettingsSection>
      </ScrollView>
    </View>
  );
}
