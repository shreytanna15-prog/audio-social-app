# Superpowered Audio (local Expo module)

Offline Clean engine (post-record):

- **Speech (`speech-clean`):** HPF → 7-band EQ → de-esser → auto-threshold compressor → limiter  
  (DeepFilter runs in JS before this for speech mode)
- **Instrument (`instrument-clean`):** light HPF / EQ / soft compressor / limiter
  (no DeepFilter, no hard gate)
- **Mixed (`mixed-clean`):** soft polish bed + light de-esser  

Editor effects (offline file process):

- **FX / Autotune / Comp / EQ / Echo / Reverb** via `processEffectsFile` (Voloco-style named presets with fixed values)
- **EQ** uses Voloco Custom EQ: high-pass + 7 bands (200…8000 Hz) + high shelf; free presets are locked recipes of those knobs
- **Comp** uses Voloco Custom Compressor: mix, input/output gain, attack, release, ratio, auto-threshold / threshold diff
- **Echo** uses a stereo delay engine matching Voloco Custom controls: duck, tempo sync, L/R delay + feedback, x-over (ping-pong), dry/wet
- **Reverb** uses Voloco Custom controls: mix, width, damp, room size, pre-delay (0–500 ms)
- **Clean Voice** via DeepFilter in JS, then optional Superpowered chain
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
