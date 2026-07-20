# Superpowered Audio (local Expo module)

Offline Clean engine (post-record):

- **Speech (`speech-clean`):** HPF → 7-band EQ → de-esser → auto-threshold compressor → limiter  
  (DeepFilter runs in JS before this for speech mode)
- **Instrument (`instrument-clean`):** interference-soften (spectral soft mask) → light HPF / EQ / soft compressor / limiter  
  (no DeepFilter, no hard gate)
- **Mixed (`mixed-clean`):** soft polish bed + light de-esser  
  (no spectral soften by default)

Editor effects (offline file process):

- **reverb / echo / modulate / enhance** via `processEffectsFile`
- **denoise** via DeepFilter in JS, then optional Superpowered chain
- FFmpeg is used only to encode WAV → M4A when needed

## JS API

```ts
import { polishRecordingWithSuperpowered } from '@/module/audio/services/superpowered-polish.service';
import { processFileWithSuperpoweredEffects } from '@/module/audio/services/superpowered-audio.service';

await polishRecordingWithSuperpowered({
  inputUri,
  outputUri,
  mode: 'instrument', // resolves to instrument-clean
});

await processFileWithSuperpoweredEffects(
  inputUri,
  outputWavUri,
  JSON.stringify([{ id: 'reverb', params: { roomSize: 2, amount: 50 } }]),
);
```

Instrument optimize (via `recording-optimize.service`) runs:

```text
record → interference-soften (SpectralClean) → instrument-clean polish → preview
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
npx expo run:android --device
```
