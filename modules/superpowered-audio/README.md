# Superpowered Audio (local Expo module)

Offline Clean engine (post-record):

- **Speech (`speech-clean`):** HPF → 7-band EQ → de-esser → auto-threshold compressor → limiter  
  (DeepFilter runs in JS before this for speech mode)
- **Instrument (`instrument-clean`):** light HPF / EQ / soft compressor / limiter
  (no DeepFilter, no hard gate)
- **Mixed (`mixed-clean`):** soft polish bed + light de-esser  

Editor effects (offline file process):

- **FX / Comp / EQ / Echo / Reverb** via `processEffectsFile` (Voloco-style named presets with fixed values)
- **FX presets:** Hard Tune / Natural Tune = YIN + Signalsmith Stretch (half-rate, small STFT — chromatic, melody-preserving). Clean = pass-through (instant, no pitch engine). Big Chorus = Superpowered Flanger. Super Vocoder and Autotune chips removed. No Key picker.
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
native/signalsmith-stretch/   (MIT — FX melody retune)
native/signalsmith-linear/    (MIT — Stretch dependency)
```

## Rebuild required

Native C++ changes need a native rebuild:

```sh
npm run android:dev
# or
npx expo run:ios
```

## FX ear check (after native rebuild)

Sung “do re mi” vs Off:

1. **Hard Tune:** audible snap; still hear do, then re, then mi. Should feel clearly faster than the old full-rate `presetCheaper` path.
2. **Natural Tune:** softer pull; vibrato mostly there; scale intact.
3. **Clean:** same as raw take (instant — no pitch render).
4. **Big Chorus:** thicker/wider (Flanger); not Echo repeats.
5. **Clear FX:** back to the raw take.

Success bar: “I still hear the notes I sang.”
