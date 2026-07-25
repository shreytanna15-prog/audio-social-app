#include <jni.h>
#include <string>

#include "SpectralClean.h"
#include "SuperpoweredEffects.h"
#include "SuperpoweredPolish.h"

extern "C" JNIEXPORT jboolean JNICALL
Java_expo_modules_superpoweredaudio_SuperpoweredAudioModule_nativeInitialize(
  JNIEnv *env,
  jobject /* thiz */,
  jstring licenseKey
) {
  const char *key = env->GetStringUTFChars(licenseKey, nullptr);
  const int ok = SuperpoweredPolish_initialize(key);
  env->ReleaseStringUTFChars(licenseKey, key);
  return ok ? JNI_TRUE : JNI_FALSE;
}

extern "C" JNIEXPORT jstring JNICALL
Java_expo_modules_superpoweredaudio_SuperpoweredAudioModule_nativeProcessFile(
  JNIEnv *env,
  jobject /* thiz */,
  jstring inputUri,
  jstring outputUri,
  jstring preset
) {
  const char *input = env->GetStringUTFChars(inputUri, nullptr);
  const char *output = env->GetStringUTFChars(outputUri, nullptr);
  const char *presetChars = env->GetStringUTFChars(preset, nullptr);

  std::string strategy = "superpowered-";
  strategy += (presetChars != nullptr ? presetChars : "speech-polish");

  const int code = SuperpoweredPolish_processFile(input, output, presetChars);

  env->ReleaseStringUTFChars(inputUri, input);
  env->ReleaseStringUTFChars(outputUri, output);
  env->ReleaseStringUTFChars(preset, presetChars);

  if (code != 0) {
    const char *error = SuperpoweredPolish_lastError();
    jclass exceptionClass = env->FindClass("java/lang/Exception");
    env->ThrowNew(exceptionClass, error != nullptr ? error : "Superpowered polish failed.");
    return nullptr;
  }

  return env->NewStringUTF(strategy.c_str());
}

extern "C" JNIEXPORT jstring JNICALL
Java_expo_modules_superpoweredaudio_SuperpoweredAudioModule_nativeSpectralCleanProcessFile(
  JNIEnv *env,
  jobject /* thiz */,
  jstring inputUri,
  jstring outputUri,
  jstring intensity
) {
  const char *input = env->GetStringUTFChars(inputUri, nullptr);
  const char *output = env->GetStringUTFChars(outputUri, nullptr);
  const char *intensityChars =
    intensity != nullptr ? env->GetStringUTFChars(intensity, nullptr) : nullptr;

  const int code = SpectralClean_processFile(input, output, intensityChars);

  env->ReleaseStringUTFChars(inputUri, input);
  env->ReleaseStringUTFChars(outputUri, output);
  if (intensity != nullptr && intensityChars != nullptr) {
    env->ReleaseStringUTFChars(intensity, intensityChars);
  }

  if (code != 0) {
    const char *error = SpectralClean_lastError();
    jclass exceptionClass = env->FindClass("java/lang/Exception");
    env->ThrowNew(exceptionClass, error != nullptr ? error : "Spectral clean failed.");
    return nullptr;
  }

  const char *stats = SpectralClean_lastStats();
  if (stats != nullptr && stats[0] != '\0') {
    return env->NewStringUTF(stats);
  }
  return env->NewStringUTF("strategy=interference-soften");
}

extern "C" JNIEXPORT jstring JNICALL
Java_expo_modules_superpoweredaudio_SuperpoweredAudioModule_nativeProcessEffectsFile(
  JNIEnv *env,
  jobject /* thiz */,
  jstring inputUri,
  jstring outputUri,
  jstring effectsJson
) {
  const char *input = env->GetStringUTFChars(inputUri, nullptr);
  const char *output = env->GetStringUTFChars(outputUri, nullptr);
  const char *json = env->GetStringUTFChars(effectsJson, nullptr);

  const int code = SuperpoweredEffects_processFile(input, output, json);

  env->ReleaseStringUTFChars(inputUri, input);
  env->ReleaseStringUTFChars(outputUri, output);
  env->ReleaseStringUTFChars(effectsJson, json);

  if (code != 0) {
    const char *error = SuperpoweredEffects_lastError();
    jclass exceptionClass = env->FindClass("java/lang/Exception");
    env->ThrowNew(exceptionClass, error != nullptr ? error : "Superpowered effects failed.");
    return nullptr;
  }

  return env->NewStringUTF("superpowered-effects");
}
