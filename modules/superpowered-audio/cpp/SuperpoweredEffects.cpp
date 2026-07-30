#include "SuperpoweredEffects.h"

#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <string>
#include <vector>

#include "Superpowered.h"
#include "SuperpoweredAutomaticVocalPitchCorrection.h"
#include "SuperpoweredCompressor.h"
#include "SuperpoweredDecoder.h"
#include "SuperpoweredEcho.h"
#include "SuperpoweredFilter.h"
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

std::string readStringParam(Superpowered::json *params, const char *key) {
  if (params == nullptr) {
    return {};
  }
  Superpowered::json *node = params->stringAtKey(key);
  if (node == nullptr || node->value.string == nullptr) {
    return {};
  }
  return node->value.string;
}

struct EffectSpec {
  std::string id;
  std::string preset;
  std::string scale;
  std::string speed;
  float roomSize = 2.0f;
  float amount = 25.0f;
  float delay = 2.0f;
  float intensity = 30.0f;
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

    spec.preset = readStringParam(params, "preset");
    spec.scale = readStringParam(params, "scale");
    spec.speed = readStringParam(params, "speed");

    if (spec.id == "reverb") {
      spec.roomSize = readNumberParam(params, "roomSize", 2.0f);
      spec.amount = clampf(readNumberParam(params, "amount", 25.0f), 0.0f, 30.0f);
      specs.push_back(spec);
    } else if (spec.id == "echo") {
      spec.delay = readNumberParam(params, "delay", 2.0f);
      spec.intensity = clampf(readNumberParam(params, "intensity", 30.0f), 0.0f, 35.0f);
      specs.push_back(spec);
    } else if (spec.id == "eq" || spec.id == "compressor" || spec.id == "autotune") {
      specs.push_back(spec);
    }
  }

  root->dealloc();
  return specs;
}

struct EqBank {
  Superpowered::Filter *highpass = nullptr;
  Superpowered::Filter *lowShelf = nullptr;
  Superpowered::Filter *mudCut = nullptr;
  Superpowered::Filter *presence = nullptr;
  Superpowered::Filter *hiShelf = nullptr;

  void destroy() {
    delete highpass;
    delete lowShelf;
    delete mudCut;
    delete presence;
    delete hiShelf;
    highpass = lowShelf = mudCut = presence = hiShelf = nullptr;
  }

  void process(float *buffer, unsigned int frames, unsigned int samplerate) {
    if (highpass != nullptr) {
      highpass->samplerate = samplerate;
      highpass->process(buffer, buffer, frames);
    }
    if (lowShelf != nullptr) {
      lowShelf->samplerate = samplerate;
      lowShelf->process(buffer, buffer, frames);
    }
    if (mudCut != nullptr) {
      mudCut->samplerate = samplerate;
      mudCut->process(buffer, buffer, frames);
    }
    if (presence != nullptr) {
      presence->samplerate = samplerate;
      presence->process(buffer, buffer, frames);
    }
    if (hiShelf != nullptr) {
      hiShelf->samplerate = samplerate;
      hiShelf->process(buffer, buffer, frames);
    }
  }
};

EqBank buildEqBank(const std::string &preset, unsigned int samplerate) {
  EqBank bank;

  if (preset == "warm-bass") {
    bank.lowShelf = new Superpowered::Filter(Superpowered::Filter::LowShelf, samplerate);
    bank.lowShelf->frequency = 150.0f;
    bank.lowShelf->decibel = 3.0f;
    bank.lowShelf->enabled = true;

    bank.mudCut = new Superpowered::Filter(Superpowered::Filter::Parametric, samplerate);
    bank.mudCut->frequency = 300.0f;
    bank.mudCut->octave = 0.7f;
    bank.mudCut->decibel = -2.0f;
    bank.mudCut->enabled = true;
  } else if (preset == "clear-notes") {
    bank.mudCut = new Superpowered::Filter(Superpowered::Filter::Parametric, samplerate);
    bank.mudCut->frequency = 300.0f;
    bank.mudCut->octave = 0.7f;
    bank.mudCut->decibel = -2.0f;
    bank.mudCut->enabled = true;

    bank.presence = new Superpowered::Filter(Superpowered::Filter::Parametric, samplerate);
    bank.presence->frequency = 3200.0f;
    bank.presence->octave = 0.8f;
    bank.presence->decibel = 1.5f;
    bank.presence->enabled = true;
  } else if (preset == "bright") {
    bank.mudCut = new Superpowered::Filter(Superpowered::Filter::Parametric, samplerate);
    bank.mudCut->frequency = 300.0f;
    bank.mudCut->octave = 0.7f;
    bank.mudCut->decibel = -1.0f;
    bank.mudCut->enabled = true;

    bank.hiShelf = new Superpowered::Filter(Superpowered::Filter::HighShelf, samplerate);
    bank.hiShelf->frequency = 5000.0f;
    bank.hiShelf->decibel = 2.0f;
    bank.hiShelf->enabled = true;
  } else {
    // vocal-presence (default speech-friendly)
    bank.highpass = new Superpowered::Filter(Superpowered::Filter::Resonant_Highpass, samplerate);
    bank.highpass->frequency = 80.0f;
    bank.highpass->resonance = 0.1f;
    bank.highpass->enabled = true;

    bank.presence = new Superpowered::Filter(Superpowered::Filter::Parametric, samplerate);
    bank.presence->frequency = 3500.0f;
    bank.presence->octave = 0.8f;
    bank.presence->decibel = 2.0f;
    bank.presence->enabled = true;
  }

  return bank;
}

Superpowered::AutomaticVocalPitchCorrection::TunerScale parseAutotuneScale(
  const std::string &scale
) {
  using Scale = Superpowered::AutomaticVocalPitchCorrection::TunerScale;
  if (scale == "CMAJOR" || scale == "AMINOR") {
    return Scale::CMAJOR;
  }
  if (scale == "CSHARPMAJOR" || scale == "ASHARPMINOR") {
    return Scale::CSHARPMAJOR;
  }
  if (scale == "DMAJOR" || scale == "BMINOR") {
    return Scale::DMAJOR;
  }
  if (scale == "DSHARPMAJOR" || scale == "CMINOR") {
    return Scale::DSHARPMAJOR;
  }
  if (scale == "EMAJOR" || scale == "CSHARPMINOR") {
    return Scale::EMAJOR;
  }
  if (scale == "FMAJOR" || scale == "DMINOR") {
    return Scale::FMAJOR;
  }
  if (scale == "FSHARPMAJOR" || scale == "DSHARPMINOR") {
    return Scale::FSHARPMAJOR;
  }
  if (scale == "GMAJOR" || scale == "EMINOR") {
    return Scale::GMAJOR;
  }
  if (scale == "GSHARPMAJOR" || scale == "FMINOR") {
    return Scale::GSHARPMAJOR;
  }
  if (scale == "AMAJOR" || scale == "FSHARPMINOR") {
    return Scale::AMAJOR;
  }
  if (scale == "ASHARPMAJOR" || scale == "GMINOR") {
    return Scale::ASHARPMAJOR;
  }
  if (scale == "BMAJOR" || scale == "GSHARPMINOR") {
    return Scale::BMAJOR;
  }
  return Scale::CHROMATIC;
}

Superpowered::AutomaticVocalPitchCorrection::TunerSpeed parseAutotuneSpeed(
  const std::string &speed
) {
  using Speed = Superpowered::AutomaticVocalPitchCorrection::TunerSpeed;
  if (speed == "SUBTLE") {
    return Speed::SUBTLE;
  }
  if (speed == "EXTREME") {
    return Speed::EXTREME;
  }
  return Speed::MEDIUM;
}

Superpowered::AutomaticVocalPitchCorrection *buildAutotune(
  const EffectSpec &spec,
  unsigned int samplerate
) {
  Superpowered::AutomaticVocalPitchCorrection *autotune =
    new Superpowered::AutomaticVocalPitchCorrection();
  autotune->samplerate = samplerate;
  autotune->scale = parseAutotuneScale(spec.scale);
  autotune->speed = parseAutotuneSpeed(spec.speed);
  autotune->range = Superpowered::AutomaticVocalPitchCorrection::WIDE;
  autotune->clamp = Superpowered::AutomaticVocalPitchCorrection::LOOSE;
  autotune->frequencyOfA = 440.0f;
  return autotune;
}

Superpowered::Compressor *buildCompressor(const std::string &preset, unsigned int samplerate) {
  Superpowered::Compressor *compressor = new Superpowered::Compressor(samplerate);
  compressor->hpCutOffHz = 80.0f;
  compressor->attackSec = 0.012f;
  compressor->releaseSec = 0.25f;
  compressor->enabled = true;

  if (preset == "punch") {
    compressor->inputGainDb = 1.5f;
    compressor->thresholdDb = -18.0f;
    compressor->ratio = 2.6f;
    compressor->wet = 0.65f;
  } else if (preset == "pop") {
    compressor->inputGainDb = 1.0f;
    compressor->thresholdDb = -16.0f;
    compressor->ratio = 2.2f;
    compressor->wet = 0.55f;
  } else {
    // gentle
    compressor->inputGainDb = 0.5f;
    compressor->thresholdDb = -14.0f;
    compressor->ratio = 1.8f;
    compressor->wet = 0.45f;
  }

  return compressor;
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
  if (specs.empty()) {
    if (gLastError[0] != '\0') {
      return 3;
    }
    setError("No supported edit effects in chain.");
    return 3;
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

  Superpowered::AutomaticVocalPitchCorrection *autotune = nullptr;
  Superpowered::Compressor *compressor = nullptr;
  EqBank eqBank;
  Superpowered::Echo *echo = nullptr;
  Superpowered::Reverb *reverb = nullptr;
  Superpowered::Limiter *limiter = nullptr;

  for (const EffectSpec &spec : specs) {
    if (spec.id == "autotune" && autotune == nullptr) {
      autotune = buildAutotune(spec, samplerate);
    } else if (spec.id == "compressor" && compressor == nullptr) {
      compressor = buildCompressor(spec.preset.empty() ? "gentle" : spec.preset, samplerate);
    } else if (spec.id == "eq" && eqBank.mudCut == nullptr && eqBank.lowShelf == nullptr &&
               eqBank.presence == nullptr && eqBank.hiShelf == nullptr && eqBank.highpass == nullptr) {
      eqBank = buildEqBank(spec.preset.empty() ? "clear-notes" : spec.preset, samplerate);
    } else if (spec.id == "echo" && echo == nullptr) {
      echo = new Superpowered::Echo(samplerate);
      const float delayLevel = clampf(spec.delay, 1.0f, 3.0f);
      const float wet = clampf(spec.intensity / 100.0f, 0.0f, 0.35f);
      echo->bpm = 120.0f;
      echo->beats = delayLevel <= 1.5f ? 0.25f : (delayLevel >= 2.5f ? 0.75f : 0.5f);
      echo->decay = 0.28f + wet * 0.25f;
      echo->setMix(wet);
      echo->enabled = true;
    } else if (spec.id == "reverb" && reverb == nullptr) {
      reverb = new Superpowered::Reverb(samplerate);
      const float room = clampf((spec.roomSize - 1.0f) / 2.0f, 0.0f, 1.0f);
      const float wet = clampf(spec.amount / 100.0f, 0.0f, 0.30f);
      reverb->roomSize = 0.30f + room * 0.45f;
      reverb->mix = wet;
      reverb->damp = 0.50f;
      reverb->width = 1.0f;
      reverb->enabled = true;
    }
  }

  // Light ceiling only when dynamics/tone ran (keeps levels safe, not a Master chip).
  if (compressor != nullptr || eqBank.presence != nullptr || eqBank.lowShelf != nullptr) {
    limiter = new Superpowered::Limiter(samplerate);
    limiter->ceilingDb = -1.0f;
    limiter->thresholdDb = -2.5f;
    limiter->releaseSec = 0.06f;
    limiter->enabled = true;
  }

  const unsigned int framesPerChunk = decoder->getFramesPerChunk();
  short int *intBuffer = (short int *)std::malloc(framesPerChunk * 2 * sizeof(short int) + 16384);
  float *floatBuffer = (float *)std::malloc(framesPerChunk * 2 * sizeof(float) + 16384);

  if (intBuffer == nullptr || floatBuffer == nullptr) {
    setError("Out of memory allocating audio buffers.");
    std::free(intBuffer);
    std::free(floatBuffer);
    delete limiter;
    delete autotune;
    delete compressor;
    eqBank.destroy();
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

    // Chain order: Autotune → Comp → EQ → Echo → Reverb
    if (autotune != nullptr) {
      autotune->samplerate = samplerate;
      autotune->process(floatBuffer, floatBuffer, true, frames);
    }
    if (compressor != nullptr) {
      compressor->samplerate = samplerate;
      compressor->process(floatBuffer, floatBuffer, frames);
    }
    eqBank.process(floatBuffer, frames, samplerate);
    if (echo != nullptr) {
      echo->samplerate = samplerate;
      echo->process(floatBuffer, floatBuffer, frames);
    }
    if (reverb != nullptr) {
      reverb->samplerate = samplerate;
      reverb->process(floatBuffer, floatBuffer, frames);
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
  delete autotune;
  delete compressor;
  eqBank.destroy();
  delete echo;
  delete reverb;
  Superpowered::closeWAV(destinationFile);
  delete decoder;

  setError(nullptr);
  return 0;
}
