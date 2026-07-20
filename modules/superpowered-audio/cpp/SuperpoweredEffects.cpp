#include "SuperpoweredEffects.h"

#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <string>
#include <vector>

#include "Superpowered.h"
#include "SuperpoweredCompressor.h"
#include "SuperpoweredDecoder.h"
#include "SuperpoweredEcho.h"
#include "SuperpoweredFilter.h"
#include "SuperpoweredFlanger.h"
#include "SuperpoweredJSON.h"
#include "SuperpoweredLimiter.h"
#include "SuperpoweredPolish.h"
#include "SuperpoweredReverb.h"
#include "SuperpoweredSimple.h"

namespace {

char gLastError[512] = {0};

void setError(const char *message) {
  if (message == nullptr) {
    gLastError[0] = '\0';
    return;
  }
  std::snprintf(gLastError, sizeof(gLastError), "%s", message);
}

float clampf(float value, float lo, float hi) {
  if (value < lo) {
    return lo;
  }
  if (value > hi) {
    return hi;
  }
  return value;
}

std::string stripFileUri(const char *uriOrPath) {
  if (uriOrPath == nullptr) {
    return {};
  }

  std::string path(uriOrPath);
  if (path.rfind("file://", 0) == 0) {
    path = path.substr(7);
#ifdef __ANDROID__
    if (path.size() >= 2 && path[0] == '/' && path[1] == '/') {
      path = path.substr(1);
    }
#endif
  }
  return path;
}

float readNumberParam(Superpowered::json *params, const char *key, float fallback) {
  if (params == nullptr) {
    return fallback;
  }
  Superpowered::json *node = params->atKey(key);
  if (node == nullptr) {
    return fallback;
  }
  if (node->type == Superpowered::json::jdouble) {
    return static_cast<float>(node->value.d);
  }
  if (node->type == Superpowered::json::jint) {
    return static_cast<float>(node->value.i);
  }
  if (node->type == Superpowered::json::jstring && node->value.string != nullptr) {
    return static_cast<float>(std::atof(node->value.string));
  }
  return fallback;
}

struct EffectSpec {
  std::string id;
  float roomSize = 2.0f;
  float amount = 50.0f;
  float delay = 2.0f;
  float intensity = 50.0f;
  float speed = 2.0f;
  float strength = 2.0f;
  float clarity = 50.0f;
};

std::vector<EffectSpec> parseEffects(const char *effectsJson) {
  std::vector<EffectSpec> specs;
  if (effectsJson == nullptr || effectsJson[0] == '\0') {
    return specs;
  }

  Superpowered::json *root = Superpowered::json::parse(effectsJson);
  if (root == nullptr) {
    setError("Invalid effects JSON.");
    return specs;
  }

  Superpowered::json *arrayRoot = root;
  if (root->type == Superpowered::json::jobject) {
    // Accept { "effects": [ ... ] } or a bare array.
    Superpowered::json *nested = root->atKey("effects");
    if (nested != nullptr) {
      arrayRoot = nested;
    }
  }

  if (arrayRoot->type != Superpowered::json::jarray) {
    root->dealloc();
    setError("effectsJson must be a JSON array.");
    return specs;
  }

  const int count = arrayRoot->getArraySize();
  for (int i = 0; i < count; ++i) {
    Superpowered::json *item = arrayRoot->atIndex(i);
    if (item == nullptr || item->type != Superpowered::json::jobject) {
      continue;
    }

    Superpowered::json *idNode = item->stringAtKey("id");
    if (idNode == nullptr || idNode->value.string == nullptr) {
      continue;
    }

    EffectSpec spec;
    spec.id = idNode->value.string;
    Superpowered::json *params = item->atKey("params");
    if (params == nullptr) {
      params = item;
    }

    if (spec.id == "reverb") {
      spec.roomSize = readNumberParam(params, "roomSize", 2.0f);
      spec.amount = readNumberParam(params, "amount", 50.0f);
    } else if (spec.id == "echo") {
      spec.delay = readNumberParam(params, "delay", 2.0f);
      spec.intensity = readNumberParam(params, "intensity", 50.0f);
    } else if (spec.id == "modulate") {
      spec.speed = readNumberParam(params, "speed", 2.0f);
    } else if (spec.id == "enhance") {
      spec.strength = readNumberParam(params, "strength", 2.0f);
      spec.clarity = readNumberParam(params, "clarity", 50.0f);
    } else if (spec.id == "denoise") {
      // Denoise is handled in JS via DeepFilter before this call.
      continue;
    } else {
      continue;
    }

    specs.push_back(spec);
  }

  root->dealloc();
  return specs;
}

} // namespace

extern "C" const char *SuperpoweredEffects_lastError(void) {
  return gLastError;
}

extern "C" int SuperpoweredEffects_processFile(
  const char *inputPath,
  const char *outputWavPath,
  const char *effectsJson
) {
  setError(nullptr);

  if (!SuperpoweredPolish_isInitialized()) {
    // Polish init also initializes Superpowered SDK license.
    setError("Superpowered is not initialized. Call SuperpoweredPolish_initialize first.");
    return 1;
  }

  const std::string input = stripFileUri(inputPath);
  const std::string output = stripFileUri(outputWavPath);
  if (input.empty() || output.empty()) {
    setError("Input or output path is empty.");
    return 2;
  }

  std::vector<EffectSpec> specs = parseEffects(effectsJson);
  if (specs.empty() && (effectsJson == nullptr || std::strstr(effectsJson, "denoise") == nullptr)) {
    // Allow empty Superpowered chain only when denoise-only was requested (passthrough copy).
    if (gLastError[0] != '\0') {
      return 3;
    }
  }

  Superpowered::Decoder *decoder = new Superpowered::Decoder();
  int openReturn = decoder->open(input.c_str());
  if (openReturn != Superpowered::Decoder::OpenSuccess) {
    char buffer[256];
    std::snprintf(
      buffer,
      sizeof(buffer),
      "Decoder open failed (%i): %s",
      openReturn,
      Superpowered::Decoder::statusCodeToString(openReturn)
    );
    setError(buffer);
    delete decoder;
    return 4;
  }

  const unsigned int samplerate = decoder->getSamplerate();
  FILE *destinationFile = Superpowered::createWAV(output.c_str(), samplerate, 2);
  if (!destinationFile) {
    setError("Could not create output WAV file.");
    delete decoder;
    return 5;
  }

  Superpowered::Reverb *reverb = nullptr;
  Superpowered::Echo *echo = nullptr;
  Superpowered::Flanger *flanger = nullptr;
  Superpowered::Filter *presenceEq = nullptr;
  Superpowered::Compressor *compressor = nullptr;
  Superpowered::Limiter *limiter = nullptr;

  for (const EffectSpec &spec : specs) {
    if (spec.id == "reverb" && reverb == nullptr) {
      reverb = new Superpowered::Reverb(samplerate);
      const float room = clampf((spec.roomSize - 1.0f) / 2.0f, 0.0f, 1.0f);
      const float wet = clampf(spec.amount / 100.0f, 0.0f, 1.0f);
      reverb->roomSize = 0.35f + room * 0.55f;
      reverb->mix = wet * 0.65f;
      reverb->damp = 0.45f;
      reverb->width = 1.0f;
      reverb->enabled = true;
    } else if (spec.id == "echo" && echo == nullptr) {
      echo = new Superpowered::Echo(samplerate);
      const float delayLevel = clampf(spec.delay, 1.0f, 3.0f);
      const float wet = clampf(spec.intensity / 100.0f, 0.0f, 1.0f);
      echo->bpm = 120.0f;
      // 1=quick (~0.25 beat), 2=classic (~0.5), 3=long (~1.0)
      echo->beats = delayLevel <= 1.5f ? 0.25f : (delayLevel >= 2.5f ? 1.0f : 0.5f);
      echo->decay = 0.35f + wet * 0.4f;
      echo->setMix(wet * 0.7f);
      echo->enabled = true;
    } else if (spec.id == "modulate" && flanger == nullptr) {
      flanger = new Superpowered::Flanger(samplerate);
      const float speed = clampf(spec.speed, 1.0f, 3.0f);
      flanger->bpm = 120.0f;
      flanger->lfoBeats = speed <= 1.5f ? 32.0f : (speed >= 2.5f ? 4.0f : 12.0f);
      flanger->wet = 0.45f;
      flanger->depth = 0.35f;
      flanger->stereo = true;
      flanger->enabled = true;
    } else if (spec.id == "enhance") {
      const float strength = clampf(spec.strength, 1.0f, 3.0f);
      const float clarity = clampf(spec.clarity / 100.0f, 0.0f, 1.0f);
      if (presenceEq == nullptr) {
        presenceEq = new Superpowered::Filter(Superpowered::Filter::Parametric, samplerate);
        presenceEq->frequency = 3200.0f;
        presenceEq->octave = 0.8f;
        presenceEq->decibel = 1.0f + clarity * 3.5f;
        presenceEq->enabled = true;
      }
      if (compressor == nullptr) {
        compressor = new Superpowered::Compressor(samplerate);
        compressor->inputGainDb = 0.5f * strength;
        compressor->thresholdDb = -18.0f - (strength - 1.0f) * 3.0f;
        compressor->ratio = 1.6f + strength * 0.4f;
        compressor->attackSec = 0.01f;
        compressor->releaseSec = 0.22f;
        compressor->wet = 0.55f + strength * 0.1f;
        compressor->hpCutOffHz = 80.0f;
        compressor->enabled = true;
      }
      if (limiter == nullptr) {
        limiter = new Superpowered::Limiter(samplerate);
        limiter->ceilingDb = -1.0f;
        limiter->thresholdDb = -2.0f;
        limiter->releaseSec = 0.05f;
        limiter->enabled = true;
      }
    }
  }

  const unsigned int framesPerChunk = decoder->getFramesPerChunk();
  short int *intBuffer = (short int *)std::malloc(framesPerChunk * 2 * sizeof(short int) + 16384);
  float *floatBuffer = (float *)std::malloc(framesPerChunk * 2 * sizeof(float) + 16384);

  if (intBuffer == nullptr || floatBuffer == nullptr) {
    setError("Out of memory allocating audio buffers.");
    std::free(intBuffer);
    std::free(floatBuffer);
    delete limiter;
    delete compressor;
    delete presenceEq;
    delete flanger;
    delete echo;
    delete reverb;
    Superpowered::closeWAV(destinationFile);
    delete decoder;
    return 6;
  }

  while (true) {
    int framesDecoded = decoder->decodeAudio(intBuffer, framesPerChunk);
    if (framesDecoded < 1) {
      break;
    }

    const unsigned int frames = (unsigned int)framesDecoded;
    Superpowered::ShortIntToFloat(intBuffer, floatBuffer, frames);

    if (reverb != nullptr) {
      reverb->samplerate = samplerate;
      reverb->process(floatBuffer, floatBuffer, frames);
    }
    if (echo != nullptr) {
      echo->samplerate = samplerate;
      echo->process(floatBuffer, floatBuffer, frames);
    }
    if (flanger != nullptr) {
      flanger->samplerate = samplerate;
      flanger->process(floatBuffer, floatBuffer, frames);
    }
    if (presenceEq != nullptr && presenceEq->enabled) {
      presenceEq->samplerate = samplerate;
      presenceEq->process(floatBuffer, floatBuffer, frames);
    }
    if (compressor != nullptr) {
      compressor->samplerate = samplerate;
      compressor->process(floatBuffer, floatBuffer, frames);
    }
    if (limiter != nullptr) {
      limiter->samplerate = samplerate;
      limiter->process(floatBuffer, floatBuffer, frames);
    }

    Superpowered::FloatToShortInt(floatBuffer, intBuffer, frames);
    Superpowered::writeWAV(destinationFile, intBuffer, frames * 4);
  }

  std::free(intBuffer);
  std::free(floatBuffer);
  delete limiter;
  delete compressor;
  delete presenceEq;
  delete flanger;
  delete echo;
  delete reverb;
  Superpowered::closeWAV(destinationFile);
  delete decoder;

  setError(nullptr);
  return 0;
}
