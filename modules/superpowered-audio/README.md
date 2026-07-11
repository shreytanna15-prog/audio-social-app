# Superpowered Audio (local Expo module)

Offline polish engine:

- **Speech:** decode → EQ → compressor → limiter → WAV  
- **Instrument / mixed:** decode → HPF → **adaptive cleaner** → EQ → compressor → limiter → WAV  

Instrument cleaner (not Superpowered’s rhythmic Gate):

1. Pass-1 noise-floor estimate (quietest ~12% of 20 ms blocks)  
2. Look-ahead two-stage expander (deep cut in gaps, soft knee near music)  
3. HF duck when closed (typing/hiss often brighter than piano body)  

Protects piano; reduces gap noise. Does **not** erase typing under notes.

## JS API

```ts
import { polishRecordingWithSuperpowered } from '@/module/audio/services/superpowered-polish.service';

await polishRecordingWithSuperpowered({
  inputUri,
  outputUri,
  mode: 'instrument', // or speech | mixed
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
npx expo run:android --device
```
