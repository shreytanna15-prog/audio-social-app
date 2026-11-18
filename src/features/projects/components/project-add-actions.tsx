import { AudioLines, FileUp, Mic } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStudioProjectContextStore } from '@/features/studio/store/studio-project-context.store';
import { Text } from '@/shared/components/ui/text';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

type AddAction = {
  id: 'quick-record' | 'multitrack' | 'import-audio';
  title: string;
  Icon: typeof Mic;
  route: '/studio/quick-record' | '/studio/multitrack' | '/studio/import-audio';
};

/** Same destinations + icons as the Create sheet. */
const ACTIONS: AddAction[] = [
  {
    id: 'quick-record',
    title: 'Quick Record',
    Icon: Mic,
    route: '/studio/quick-record',
  },
  {
    id: 'multitrack',
    title: 'Multi-Track',
    Icon: AudioLines,
    route: '/studio/multitrack',
  },
  {
    id: 'import-audio',
    title: 'Import',
    Icon: FileUp,
    route: '/studio/import-audio',
  },
];

type ProjectAddActionsProps = {
  projectId: string;
};

/** Sticky bottom dock — icon + label only. */
export function ProjectAddActions({ projectId }: ProjectAddActionsProps) {
  const insets = useSafeAreaInsets();
  const { push } = useRouter();
  const { guard } = useNavigationGuard();
  const setProjectId = useStudioProjectContextStore((s) => s.setProjectId);

  return (
    <View
      className="border-t border-white/6 bg-background px-4 pt-3"
      style={{ paddingBottom: Math.max(insets.bottom, 12) + 4 }}>
      <View className="flex-row gap-2.5">
        {ACTIONS.map((action) => {
          const Icon = action.Icon;
          return (
            <Pressable
              key={action.id}
              onPress={() => {
                setProjectId(projectId);
                requestAnimationFrame(() => {
                  // Query param keeps projectId on nested studio routes (index/edit).
                  guard(() => push(
                    `${action.route}?projectId=${encodeURIComponent(projectId)}` as Href,
                  ));
                });
              }}
              accessibilityRole="button"
              accessibilityLabel={action.title}
              className="min-h-16 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-surface-container px-2 py-3"
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
              <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-container-highest">
                <Icon size={20} color="#E4E1EA" strokeWidth={2.1} />
              </View>
              <Text
                variant="label-md"
                className="text-center font-semibold text-on-surface"
                numberOfLines={1}>
                {action.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
