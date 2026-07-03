const IS_DEV = process.env.APP_VARIANT !== 'production';

/** @param {{ config: import('@expo/config-types').ExpoConfig }} ctx */
module.exports = ({ config }) => ({
  ...config,
  name: IS_DEV ? 'audio-social-media-app (Dev)' : 'audio-social-media-app',
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#208AEF',
        android: {
          image: './assets/images/splash-icon.png',
          imageWidth: 76,
        },
      },
    ],
    'expo-sharing',
    [
      'expo-audio',
      {
        microphonePermission: 'Allow Audio Social Media App to access your microphone.',
        enableBackgroundPlayback: true,
        enableBackgroundRecording: false,
      },
    ],
    [
      'expo-file-system',
      {
        supportsOpeningDocumentsInPlace: true,
        enableFileSharing: true,
      },
    ],
    ...(IS_DEV ? ['expo-dev-client'] : []),
    [
      'expo-build-properties',
      {
        android: {
          minSdkVersion: 24,
          ...(IS_DEV
            ? {}
            : {
                abiFilters: ['arm64-v8a'],
                enableMinifyInReleaseBuilds: true,
                enableShrinkResourcesInReleaseBuilds: true,
              }),
        },
      },
    ],
    './plugins/with-onnxruntime',
  ],
});
