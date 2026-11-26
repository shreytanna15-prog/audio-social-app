import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import type { FeaturedSong } from '../data/featured-song';

import { ExploreSongCard } from './explore-song-card';

const ROTATE_MS = 10_000;

type ExploreHeroCarouselProps = {
  songs: FeaturedSong[];
  onPlay: (song: FeaturedSong) => void;
};

export function ExploreHeroCarousel({ songs, onPlay }: ExploreHeroCarouselProps) {
  const [screenFocused, setScreenFocused] = useState(true);
  const [index, setIndex] = useState(0);
  const [appActive, setAppActive] = useState(
    AppState.currentState === 'active',
  );

  useFocusEffect(
    useCallback(() => {
      setScreenFocused(true);
      return () => setScreenFocused(false);
    }, []),
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      setAppActive(state === 'active');
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    setIndex(0);
  }, [songs]);

  useEffect(() => {
    if (songs.length <= 1 || !screenFocused || !appActive) {
      return;
    }
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % songs.length);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [songs.length, screenFocused, appActive]);

  const song = songs[Math.min(index, songs.length - 1)];
  if (!song) return null;

  return (
    <View>
      <Animated.View
        key={song.id}
        entering={FadeIn.duration(400)}
        exiting={FadeOut.duration(300)}>
        <ExploreSongCard
          song={song}
          onPress={() => onPlay(song)}
          onPlayPress={() => onPlay(song)}
        />
      </Animated.View>
    </View>
  );
}
