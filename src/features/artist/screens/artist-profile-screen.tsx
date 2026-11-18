import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePlayerStore } from '@/features/player';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

import { ArtistAlbumGrid } from '../components/artist-album-grid';
import { ArtistContentTabs } from '../components/artist-content-tabs';
import { ArtistFeaturedSongCard } from '../components/artist-featured-song-card';
import { ArtistHero } from '../components/artist-hero';
import { ArtistMessageSheet } from '../components/artist-message-sheet';
import { ArtistNotificationsSheet } from '../components/artist-notifications-sheet';
import { ArtistOptionsSheet } from '../components/artist-options-sheet';
import { ArtistPlaylistList } from '../components/artist-playlist-list';
import { ArtistStatsRow } from '../components/artist-stats-row';
import { ArtistTrackOptionsSheet } from '../components/artist-track-options-sheet';
import { ArtistTrackRow } from '../components/artist-track-row';
import { getArtistProfileFixture } from '../data/artist-profiles.fixtures';
import type { ArtistAlbum, ArtistContentTab, ArtistPlaylist, ArtistTrack } from '../types';

/** Enough to clear the tab bar without a huge empty scroll tail */
const TAB_BAR_CLEARANCE = 12;

export function ArtistProfileScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { push } = useRouter();
  const { guard } = useNavigationGuard();
  const insets = useSafeAreaInsets();
  const profile = getArtistProfileFixture(typeof id === 'string' ? id : undefined);

  const play = usePlayerStore((s) => s.play);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const currentTrack = usePlayerStore((s) => s.track);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const [activeTab, setActiveTab] = useState<ArtistContentTab>('songs');
  const [following, setFollowing] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [trackOptionsOpen, setTrackOptionsOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<ArtistTrack | null>(null);

  const sheetBottomOffset = Math.max(insets.bottom, 10) + 12;
  const featuredPlaying =
    isPlaying && currentTrack?.id === `artist-featured-${profile.featuredSong.id}`;

  const playTrack = (track: ArtistTrack) => {
    play({
      id: `artist-${profile.id}-${track.id}`,
      title: track.title,
      artist: profile.name,
      coverUrl: track.coverUrl,
      artistAvatarUrl: profile.avatarUrl ?? undefined,
      playsLabel: track.playsLabel,
      durationSec: track.durationSec,
      verified: profile.verified,
    });
  };

  const playFeatured = () => {
    const featuredId = `artist-featured-${profile.featuredSong.id}`;
    if (currentTrack?.id === featuredId) {
      togglePlay();
      return;
    }
    play({
      id: featuredId,
      title: profile.featuredSong.title,
      artist: profile.featuredSong.artistName,
      coverUrl: profile.featuredSong.coverUrl,
      artistAvatarUrl: profile.avatarUrl ?? undefined,
      playsLabel: profile.featuredSong.playsLabel,
      durationSec: profile.featuredSong.durationSec,
      verified: profile.verified,
    });
  };

  const openTrackAndPlay = (track: ArtistTrack) => {
    playTrack(track);
    guard(() => push('/player'));
  };

  const onAlbumPress = (album: ArtistAlbum) => {
    const first = profile.songs[0];
    if (!first) return;
    play({
      id: `artist-${profile.id}-album-${album.id}`,
      title: album.title,
      artist: profile.name,
      coverUrl: album.coverUrl,
      artistAvatarUrl: profile.avatarUrl ?? undefined,
      verified: profile.verified,
    });
  };

  const onPlaylistPress = (playlist: ArtistPlaylist) => {
    play({
      id: `artist-${profile.id}-playlist-${playlist.id}`,
      title: playlist.title,
      artist: profile.name,
      coverUrl: playlist.coverUrl,
      artistAvatarUrl: profile.avatarUrl ?? undefined,
      verified: profile.verified,
    });
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4"
        contentContainerStyle={{
          paddingBottom: TAB_BAR_CLEARANCE + Math.max(insets.bottom, 10),
        }}
        showsVerticalScrollIndicator={false}>
        <ArtistHero
          profile={profile}
          following={following}
          bioExpanded={bioExpanded}
          onToggleFollow={() => setFollowing((prev) => !prev)}
          onMessagePress={() => setMessageOpen(true)}
          onToggleBio={() => setBioExpanded((prev) => !prev)}
          onMorePress={() => setOptionsOpen(true)}
          onNotificationsPress={() => setNotificationsOpen(true)}
        />

        {/* Figma: space from “More” → metrics → featured */}
        <View className="gap-8" style={{ marginTop: 16 }}>
          <ArtistStatsRow stats={profile.stats} />
          <ArtistFeaturedSongCard
            song={profile.featuredSong}
            isPlaying={featuredPlaying}
            onPlayPress={playFeatured}
          />
        </View>

        {/* Figma: clear space under featured song; tabs spread across row */}
        <View className="gap-4" style={{ marginTop: 20 }}>
          <ArtistContentTabs activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === 'songs' ? (
            <View className="gap-2.5">
              {profile.songs.map((track) => (
                <ArtistTrackRow
                  key={track.id}
                  track={track}
                  onPress={() => openTrackAndPlay(track)}
                  onPlayPress={() => playTrack(track)}
                  onMorePress={() => {
                    setSelectedTrack(track);
                    setTrackOptionsOpen(true);
                  }}
                />
              ))}
            </View>
          ) : null}

          {activeTab === 'albums' ? (
            <ArtistAlbumGrid albums={profile.albums} onAlbumPress={onAlbumPress} />
          ) : null}

          {activeTab === 'playlists' ? (
            <ArtistPlaylistList
              playlists={profile.playlists}
              onPlaylistPress={onPlaylistPress}
            />
          ) : null}
        </View>
      </ScrollView>

      <ArtistMessageSheet
        open={messageOpen}
        onOpenChange={setMessageOpen}
        artistName={profile.name}
        targetUserId={typeof id === 'string' ? id : undefined}
        bottomOffset={sheetBottomOffset}
      />
      <ArtistOptionsSheet
        open={optionsOpen}
        onOpenChange={setOptionsOpen}
        artistName={profile.name}
        username={profile.username}
        bottomOffset={sheetBottomOffset}
      />
      <ArtistNotificationsSheet
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        bottomOffset={sheetBottomOffset}
      />
      <ArtistTrackOptionsSheet
        open={trackOptionsOpen}
        onOpenChange={setTrackOptionsOpen}
        track={selectedTrack}
        artistName={profile.name}
        bottomOffset={sheetBottomOffset}
        onPlay={playTrack}
      />
    </View>
  );
}
