# Superpowered Audio (local Expo module)

Offline Clean engine (post-record):

- **Speech (`speech-clean`):** HPF → 7-band EQ → de-esser → auto-threshold compressor → limiter  
  (DeepFilter runs in JS before this for speech mode)
- **Instrument (`instrument-clean`):** light HPF / EQ / soft compressor / limiter
  (no DeepFilter, no hard gate)
- **Mixed (`mixed-clean`):** soft polish bed + light de-esser  

Editor effects (offline file process):

- **reverb / echo / modulate / enhance** via `processEffectsFile`
- **denoise** via DeepFilter in JS, then optional Superpowered chain
- FFmpeg is used only to encode WAV → MP3 when needed

## JS API

```ts
import { polishRecordingWithSuperpowered } from '@/features/audio/services/superpowered-polish.service';

await polishRecordingWithSuperpowered({
  inputUri,
  outputUri,
  mode: 'instrument', // resolves to instrument-clean
});
```

## License key

```env
EXPO_PUBLIC_SUPERPOWERED_LICENSE_KEY=ExampleLicenseKey-WillExpire-OnNextUpdate
```

## Native SDK location

```
native/superpowered/include/
native/superpowered/android/
native/superpowered/ios/libSuperpoweredAudio.xcframework
```

## Rebuild required

Native C++ changes need a native rebuild:

```sh
npm run android:dev
# or
npx expo run:ios
```
