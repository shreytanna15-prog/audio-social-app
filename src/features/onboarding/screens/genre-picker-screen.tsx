import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button } from '@/shared/components/ui/button';
import { Text } from '@/shared/components/ui/text';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

import { GENRES, type Genre } from '../data/genres';
import { GenreCard } from '../components/genre-card';
import { OnboardingBackButton } from '../components/onboarding-back-button';
import { OnboardingBackground } from '../components/onboarding-background';
import { OnboardingProgress } from '../components/onboarding-progress';

export function GenrePickerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { guard } = useNavigationGuard();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const count = selected.size;

  const toggle = (genre: Genre) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(genre.id)) {
        next.delete(genre.id);
      } else {
        next.add(genre.id);
      }
      return next;
    });
  };

  const goToEntry = () => guard(() => router.push('/entry'));

  return (
    <View
      className="flex-1 overflow-hidden bg-surface-container-lowest"
      style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20 }}>
      <OnboardingBackground />
      <ScrollView
        contentContainerClassName="px-5 pb-4"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between py-1">
          <OnboardingBackButton onPress={() => guard(() => router.back())} />
          <OnboardingProgress step={2} />
          <Pressable onPress={goToEntry} hitSlop={8} className="px-2 py-1">
            <Text variant="label-md" className="text-on-surface-variant active:text-primary-tonal">
              Skip
            </Text>
          </Pressable>
        </View>

        <View className="mb-6 mt-6 gap-2">
          <Text variant="headline-lg-mobile" className="text-on-surface">
            What kind of music do you love?
          </Text>
          <Text variant="body-md" className="leading-relaxed text-on-surface-variant">
            Pick a few genres to personalize your experience.
          </Text>
        </View>

        <View className="flex-row flex-wrap" style={{ gap: 12 }}>
          {GENRES.map((genre) => (
            <View key={genre.id} style={{ flexBasis: '48%', flexGrow: 1 }}>
              <GenreCard
                genre={genre}
                selected={selected.has(genre.id)}
                onPress={() => toggle(genre)}
              />
            </View>
          ))}
        </View>

        <View className="mt-4 flex-col items-center gap-3 pb-2">
          <Button
            variant="tonal"
            size="lg"
            disabled={count === 0}
            onPress={goToEntry}
            className="h-14 w-full rounded-md">
            <Text>Continue</Text>
          </Button>

          <Button
            variant="secondary"
            size="default"
            onPress={goToEntry}
            className="h-12 w-full rounded-md">
            <Text>Skip for now</Text>
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}