const IS_DEV = process.env.APP_VARIANT !== 'production';

/** @param {{ config: import('@expo/config-types').ExpoConfig }} ctx */
module.exports = ({ config }) => ({
  ...config,
  name: IS_DEV ? 'VibeOGram Dev' : 'VibeOGram07112026',
  extra: {
    ...(config.extra ?? {}),
    superpoweredLicenseKey: process.env.EXPO_PUBLIC_SUPERPOWERED_LICENSE_KEY ?? '',
  },
  plugins: [
    'expo-router',
    [
      'expo-font',
      {
        ios: {
          fonts: [
            './node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf',
            './node_modules/@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf',
            './node_modules/@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf',
            './node_modules/@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf',
            './node_modules/@expo-google-fonts/space-grotesk/400Regular/SpaceGrotesk_400Regular.ttf',
            './node_modules/@expo-google-fonts/space-grotesk/500Medium/SpaceGrotesk_500Medium.ttf',
            './node_modules/@expo-google-fonts/space-grotesk/600SemiBold/SpaceGrotesk_600SemiBold.ttf',
            './node_modules/@expo-google-fonts/space-grotesk/700Bold/SpaceGrotesk_700Bold.ttf',
          ],
        },
        android: {
          fonts: [
            {
              fontFamily: 'Inter',
              fontDefinitions: [
                {
                  path: './node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf',
                  weight: 400,
                },
                {
                  path: './node_modules/@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf',
                  weight: 500,
                },
                {
                  path: './node_modules/@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf',
                  weight: 600,
                },
                {
                  path: './node_modules/@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf',
                  weight: 700,
                },
              ],
            },
            {
              fontFamily: 'Space Grotesk',
              fontDefinitions: [
                {
                  path: './node_modules/@expo-google-fonts/space-grotesk/400Regular/SpaceGrotesk_400Regular.ttf',
                  weight: 400,
                },
                {
                  path: './node_modules/@expo-google-fonts/space-grotesk/500Medium/SpaceGrotesk_500Medium.ttf',
                  weight: 500,
                },
                {
                  path: './node_modules/@expo-google-fonts/space-grotesk/600SemiBold/SpaceGrotesk_600SemiBold.ttf',
                  weight: 600,
                },
                {
                  path: './node_modules/@expo-google-fonts/space-grotesk/700Bold/SpaceGrotesk_700Bold.ttf',
                  weight: 700,
                },
              ],
            },
          ],
        },
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#131319',
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
    'expo-document-picker',
    'expo-secure-store',
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
    [
      'expo-image-picker',
      {
        photosPermission:
          'Allow VibeOGram to access your photos to set a profile picture.',
        cameraPermission:
          'Allow VibeOGram to use your camera to take a profile picture.',
      },
    ],
  ],
});
