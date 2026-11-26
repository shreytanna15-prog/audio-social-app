import { type ReactNode, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePlayerStore } from '@/features/player';
import { useAppChromeNav } from '@/shared/lib/use-app-chrome-nav';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

import type { Profile, ProfileAlbum, ProfileContentTab, ProfilePlaylist, ProfileTrack } from '../types';
import { ProfileAlbumGrid } from './profile-album-grid';
import { ProfileContentTabs } from './profile-content-tabs';
import { ProfileFeaturedSongCard } from './profile-featured-song-card';
import { ProfileHero } from './profile-hero';
import { ProfileOptionsSheet } from './profile-options-sheet';
import { ProfilePlaylistList } from './profile-playlist-list';
import { ProfileStatsRow } from './profile-stats-row';
import { ProfileTrackOptionsSheet } from './profile-track-options-sheet';
import { ProfileTrackRow } from './profile-track-row';

const TAB_BAR_CLEARANCE = 12;

type ProfileScreenShellProps = {
  profile: Profile;
  actions: ReactNode;
  /** Extra row in the more sheet (e.g. Log out on my profile). */
  onLogout?: () => void;
  /** My profile — opens Settings hub. */
  onSettingsPress?: () => void;
  /** Public-only sheets can be omitted by not rendering message sheet from parent. */
  messageSheet?: ReactNode;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
};

/**
 * Shared scroll layout + player wiring for my profile and public profile.
 */
export function ProfileScreenShell({
  profile,
  actions,
  onLogout,
  onSettingsPress,
  messageSheet,
  onFollowersPress,
  onFollowingPress,
}: ProfileScreenShellProps) {
  const { push } = useRouter();
  const { guard } = useNavigationGuard();
  const { openNotifications } = useAppChromeNav();
  const insets = useSafeAreaInsets();

  const play = usePlayerStore((s) => s.play);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const currentTrack = usePlayerStore((s) => s.track);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const [activeTab, setActiveTab] = useState<ProfileContentTab>('songs');
  const [bioExpanded, setBioExpanded] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [trackOptionsOpen, setTrackOptionsOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<ProfileTrack | null>(null);

  const sheetBottomOffset = Math.max(insets.bottom, 10) + 12;
  const featuredPlaying =
    isPlaying && currentTrack?.id === profile.featuredSong.id;

  const playTrack = (track: ProfileTrack) => {
    play({
      id: track.id,
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
    const featuredId = profile.featuredSong.id;
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

  const openTrackAndPlay = (track: ProfileTrack) => {
    playTrack(track);
    guard(() => push('/player'));
  };

  const onAlbumPress = (album: ProfileAlbum) => {
    guard(() => push({
      pathname: '/albums/[id]',
      params: { id: album.id, title: album.title },
    } as Href));
  };

  const onPlaylistPress = (playlist: ProfilePlaylist) => {
    guard(() => push({
      pathname: '/playlists/[id]',
      params: { id: playlist.id, title: playlist.title },
    } as Href));
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
        <ProfileHero
          profile={profile}
          actions={actions}
          bioExpanded={bioExpanded}
          onToggleBio={() => setBioExpanded((prev) => !prev)}
          onMorePress={() => setOptionsOpen(true)}
          onNotificationsPress={openNotifications}
          onSettingsPress={onSettingsPress}
        />

        <View className="gap-8" style={{ marginTop: 16 }}>
          <ProfileStatsRow
            stats={profile.stats}
            onFollowersPress={onFollowersPress}
            onFollowingPress={onFollowingPress}
          />
          <ProfileFeaturedSongCard
            song={profile.featuredSong}
            isPlaying={featuredPlaying}
            onPlayPress={playFeatured}
          />
        </View>

        <View className="gap-4" style={{ marginTop: 20 }}>
          <ProfileContentTabs activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === 'songs' ? (
            <View className="gap-2.5">
              {profile.songs.map((track) => (
                <ProfileTrackRow
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
            <ProfileAlbumGrid albums={profile.albums} onAlbumPress={onAlbumPress} />
          ) : null}

          {activeTab === 'playlists' ? (
            <ProfilePlaylistList
              playlists={profile.playlists}
              onPlaylistPress={onPlaylistPress}
            />
          ) : null}
        </View>
      </ScrollView>

      {messageSheet}

      <ProfileOptionsSheet
        open={optionsOpen}
        onOpenChange={setOptionsOpen}
        profileName={profile.name}
        username={profile.username}
        bottomOffset={sheetBottomOffset}
        onLogout={onLogout}
      />
      <ProfileTrackOptionsSheet
        open={trackOptionsOpen}
        onOpenChange={setTrackOptionsOpen}
        track={selectedTrack}
        profileName={profile.name}
        bottomOffset={sheetBottomOffset}
        onPlay={playTrack}
      />
    </View>
  );
}

export function useProfileSheetBottomOffset() {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, 10) + 12;
}
