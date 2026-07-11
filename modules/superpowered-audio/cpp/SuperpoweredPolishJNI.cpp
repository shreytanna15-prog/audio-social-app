#include <jni.h>
#include <string>

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
