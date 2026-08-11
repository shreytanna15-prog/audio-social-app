#include "SuperpoweredEffects.h"

#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <string>
#include <vector>

#if defined(__ANDROID__)
#include <android/log.h>
#define EFFECTS_LOG(...) __android_log_print(ANDROID_LOG_INFO, "SuperpoweredEffects", __VA_ARGS__)
#else
#define EFFECTS_LOG(...) ((void)0)
#endif

#include "Superpowered.h"
#include "SuperpoweredAutomaticVocalPitchCorrection.h"
#include "SuperpoweredCompressor.h"
#include "SuperpoweredDecoder.h"
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

bool readOptionalNumber(Superpowered::json *params, const char *key, float *out) {
  if (params == nullptr || out == nullptr) {
    return false;
  }
  Superpowered::json *node = params->atKey(key);
  if (node == nullptr) {
    return false;
  }
  if (node->type == Superpowered::json::jdouble) {
    *out = static_cast<float>(node->value.d);
    return true;
  }
  if (node->type == Superpowered::json::jint) {
    *out = static_cast<float>(node->value.i);
    return true;
  }
  if (node->type == Superpowered::json::jstring && node->value.string != nullptr) {
    *out = static_cast<float>(std::atof(node->value.string));
    return true;
  }
  return false;
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
  std::string clamp;
  // Legacy JS amount/intensity (0–100 style) — only if sendGain absent.
  float amount = 25.0f;
  float intensity = 30.0f;
  float delay = 2.0f;
  // Native overrides (has* = JSON key present)
  bool hasSendGain = false;
  float sendGain = 0.0f;
  bool hasRoomSize = false;
  float roomSize = 0.48f;
  bool hasDamp = false;
  float damp = 0.5f;
  bool hasWidth = false;
  float width = 1.0f;
  bool hasPredelayMs = false;
  float predelayMs = 20.0f;
  bool hasLowCutHz = false;
  float lowCutHz = 250.0f;
  // Legacy echo
  bool hasBeats = false;
  float beats = 0.5f;
  bool hasDecay = false;
  float decay = 0.3f;
  bool hasTone = false;
  float tone = 0.5f;
  // Voloco Custom Echo
  bool hasDuckDelay = false;
  float duckDelay = 0.35f;
  bool hasTempoSync = false;
  bool tempoSync = true;
  bool hasLeftDelay = false;
  float leftDelay = 0.5f;
  bool hasRightDelay = false;
  float rightDelay = 0.5f;
  bool hasLeftFeedback = false;
  float leftFeedback = 0.35f;
  bool hasRightFeedback = false;
  float rightFeedback = 0.35f;
  bool hasXoverFeedback = false;
  float xoverFeedback = 0.0f;
  bool hasDryLevel = false;
  float dryLevel = 1.0f;
  bool hasWetLevel = false;
  float wetLevel = 0.5f;
  bool hasThresholdDb = false;
  float thresholdDb = -14.0f;
  bool hasRatio = false;
  float ratio = 2.0f;
  bool hasWet = false;
  float wet = 0.55f;
  bool hasOutputGainDb = false;
  float outputGainDb = 0.8f;
  bool hasAttackSec = false;
  float attackSec = 0.01f;
  bool hasBassDb = false;
  float bassDb = 0.0f;
  bool hasMudDb = false;
  float mudDb = -3.5f;
  bool hasPresenceDb = false;
  float presenceDb = 3.2f;
  bool hasBrightDb = false;
  float brightDb = 1.2f;
  bool hasHarshDb = false;
  float harshDb = -1.5f;
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
    spec.clamp = readStringParam(params, "clamp");

    spec.hasSendGain = readOptionalNumber(params, "sendGain", &spec.sendGain);
    spec.hasRoomSize = readOptionalNumber(params, "roomSize", &spec.roomSize);
    spec.hasDamp = readOptionalNumber(params, "damp", &spec.damp);
    spec.hasWidth = readOptionalNumber(params, "width", &spec.width);
    spec.hasPredelayMs = readOptionalNumber(params, "predelayMs", &spec.predelayMs);
    spec.hasLowCutHz = readOptionalNumber(params, "lowCutHz", &spec.lowCutHz);
    spec.hasBeats = readOptionalNumber(params, "beats", &spec.beats);
    spec.hasDecay = readOptionalNumber(params, "decay", &spec.decay);
    spec.hasTone = readOptionalNumber(params, "tone", &spec.tone);
    spec.hasDuckDelay = readOptionalNumber(params, "duckDelay", &spec.duckDelay);
    {
      Superpowered::json *syncNode = params->atKey("tempoSync");
      if (syncNode != nullptr) {
        spec.hasTempoSync = true;
        if (syncNode->type == Superpowered::json::jbool) {
          spec.tempoSync = syncNode->value.b != 0;
        } else if (syncNode->type == Superpowered::json::jint) {
          spec.tempoSync = syncNode->value.i != 0;
        } else if (syncNode->type == Superpowered::json::jdouble) {
          spec.tempoSync = syncNode->value.d != 0.0;
        } else if (
          syncNode->type == Superpowered::json::jstring && syncNode->value.string != nullptr
        ) {
          const char *s = syncNode->value.string;
          spec.tempoSync =
            !(s[0] == '0' || s[0] == 'f' || s[0] == 'F' || s[0] == 'n' || s[0] == 'N');
        }
      }
    }
    spec.hasLeftDelay = readOptionalNumber(params, "leftDelay", &spec.leftDelay);
    spec.hasRightDelay = readOptionalNumber(params, "rightDelay", &spec.rightDelay);
    spec.hasLeftFeedback = readOptionalNumber(params, "leftFeedback", &spec.leftFeedback);
    spec.hasRightFeedback = readOptionalNumber(params, "rightFeedback", &spec.rightFeedback);
    spec.hasXoverFeedback = readOptionalNumber(params, "xoverFeedback", &spec.xoverFeedback);
    spec.hasDryLevel = readOptionalNumber(params, "dryLevel", &spec.dryLevel);
    spec.hasWetLevel = readOptionalNumber(params, "wetLevel", &spec.wetLevel);
    spec.hasThresholdDb = readOptionalNumber(params, "thresholdDb", &spec.thresholdDb);
    spec.hasRatio = readOptionalNumber(params, "ratio", &spec.ratio);
    spec.hasWet = readOptionalNumber(params, "wet", &spec.wet);
    spec.hasOutputGainDb = readOptionalNumber(params, "outputGainDb", &spec.outputGainDb);
    spec.hasAttackSec = readOptionalNumber(params, "attackSec", &spec.attackSec);
    spec.hasBassDb = readOptionalNumber(params, "bassDb", &spec.bassDb);
    spec.hasMudDb = readOptionalNumber(params, "mudDb", &spec.mudDb);
    spec.hasPresenceDb = readOptionalNumber(params, "presenceDb", &spec.presenceDb);
    spec.hasBrightDb = readOptionalNumber(params, "brightDb", &spec.brightDb);
    spec.hasHarshDb = readOptionalNumber(params, "harshDb", &spec.harshDb);

    EFFECTS_LOG(
      "parsed id=%s preset=%s wet=%.2f Ldel=%.3f Rdel=%.3f xover=%.2f duck=%.2f sync=%d",
      spec.id.c_str(),
      spec.preset.c_str(),
      spec.wetLevel,
      spec.leftDelay,
      spec.rightDelay,
      spec.xoverFeedback,
      spec.duckDelay,
      spec.tempoSync ? 1 : 0);

    if (spec.id == "reverb") {
      spec.amount = clampf(readNumberParam(params, "amount", 28.0f), 0.0f, 45.0f);
      specs.push_back(spec);
    } else if (spec.id == "echo") {
      spec.delay = readNumberParam(params, "delay", 2.0f);
      spec.intensity = clampf(readNumberParam(params, "intensity", 35.0f), 0.0f, 55.0f);
      specs.push_back(spec);
    } else if (spec.id == "eq" || spec.id == "compressor" || spec.id == "autotune" ||
               spec.id == "fx") {
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
  Superpowered::Filter *air = nullptr;
  Superpowered::Filter *hiShelf = nullptr;
  Superpowered::Filter *sibilanceTame = nullptr;

  bool isEmpty() const {
    return highpass == nullptr && lowShelf == nullptr && mudCut == nullptr &&
           presence == nullptr && air == nullptr && hiShelf == nullptr &&
           sibilanceTame == nullptr;
  }

  void destroy() {
    delete highpass;
    delete lowShelf;
    delete mudCut;
    delete presence;
    delete air;
    delete hiShelf;
    delete sibilanceTame;
    highpass = lowShelf = mudCut = presence = air = hiShelf = sibilanceTame = nullptr;
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
    if (air != nullptr) {
      air->samplerate = samplerate;
      air->process(buffer, buffer, frames);
    }
    if (hiShelf != nullptr) {
      hiShelf->samplerate = samplerate;
      hiShelf->process(buffer, buffer, frames);
    }
    if (sibilanceTame != nullptr) {
      sibilanceTame->samplerate = samplerate;
      sibilanceTame->process(buffer, buffer, frames);
    }
  }

  /** Scale boosts only (positive dB) so stacked chains stay clear. */
  void scaleBoosts(float factor) {
    auto scale = [factor](Superpowered::Filter *f) {
      if (f != nullptr && f->decibel > 0.0f) {
        f->decibel *= factor;
      }
    };
    scale(lowShelf);
    scale(presence);
    scale(air);
    scale(hiShelf);
  }
};

EqBank buildEqBank(const EffectSpec &spec, unsigned int samplerate, bool fxAware) {
  EqBank bank;
  const float fxScale = fxAware ? 0.75f : 1.0f;
  const std::string preset = spec.preset.empty() ? "vocal-clarity" : spec.preset;

  if (preset == "mid-range-scoop") {
    bank.highpass = new Superpowered::Filter(Superpowered::Filter::Resonant_Highpass, samplerate);
    bank.highpass->frequency = 75.0f;
    bank.highpass->resonance = 0.1f;
    bank.highpass->enabled = true;

    bank.mudCut = new Superpowered::Filter(Superpowered::Filter::Parametric, samplerate);
    bank.mudCut->frequency = 500.0f;
    bank.mudCut->octave = 1.1f;
    bank.mudCut->decibel = -4.5f * fxScale;
    bank.mudCut->enabled = true;

    bank.lowShelf = new Superpowered::Filter(Superpowered::Filter::LowShelf, samplerate);
    bank.lowShelf->frequency = 140.0f;
    bank.lowShelf->slope = 0.5f;
    bank.lowShelf->decibel = 2.5f * fxScale;
    bank.lowShelf->enabled = true;

    bank.hiShelf = new Superpowered::Filter(Superpowered::Filter::HighShelf, samplerate);
    bank.hiShelf->frequency = 5500.0f;
    bank.hiShelf->slope = 0.5f;
    bank.hiShelf->decibel = 2.5f * fxScale;
    bank.hiShelf->enabled = true;
  } else if (preset == "brightness") {
    bank.highpass = new Superpowered::Filter(Superpowered::Filter::Resonant_Highpass, samplerate);
    bank.highpass->frequency = 85.0f;
    bank.highpass->resonance = 0.1f;
    bank.highpass->enabled = true;

    bank.presence = new Superpowered::Filter(Superpowered::Filter::Parametric, samplerate);
    bank.presence->frequency = 4200.0f;
    bank.presence->octave = 0.8f;
    bank.presence->decibel = 3.0f * fxScale;
    bank.presence->enabled = true;

    bank.hiShelf = new Superpowered::Filter(Superpowered::Filter::HighShelf, samplerate);
    bank.hiShelf->frequency = 6500.0f;
    bank.hiShelf->slope = 0.5f;
    bank.hiShelf->decibel = 3.0f * fxScale;
    bank.hiShelf->enabled = true;

    bank.sibilanceTame = new Superpowered::Filter(Superpowered::Filter::Parametric, samplerate);
    bank.sibilanceTame->frequency = 7800.0f;
    bank.sibilanceTame->octave = 0.5f;
    bank.sibilanceTame->decibel = -1.5f;
    bank.sibilanceTame->enabled = true;
  } else if (preset == "low-high-boost") {
    bank.highpass = new Superpowered::Filter(Superpowered::Filter::Resonant_Highpass, samplerate);
    bank.highpass->frequency = 70.0f;
    bank.highpass->resonance = 0.1f;
    bank.highpass->enabled = true;

    bank.lowShelf = new Superpowered::Filter(Superpowered::Filter::LowShelf, samplerate);
    bank.lowShelf->frequency = 160.0f;
    bank.lowShelf->slope = 0.5f;
    bank.lowShelf->decibel = 3.5f * fxScale;
    bank.lowShelf->enabled = true;

    bank.mudCut = new Superpowered::Filter(Superpowered::Filter::Parametric, samplerate);
    bank.mudCut->frequency = 320.0f;
    bank.mudCut->octave = 0.7f;
    bank.mudCut->decibel = -1.5f;
    bank.mudCut->enabled = true;

    bank.hiShelf = new Superpowered::Filter(Superpowered::Filter::HighShelf, samplerate);
    bank.hiShelf->frequency = 6000.0f;
    bank.hiShelf->slope = 0.5f;
    bank.hiShelf->decibel = 3.0f * fxScale;
    bank.hiShelf->enabled = true;
  } else if (preset == "telephone") {
    bank.highpass = new Superpowered::Filter(Superpowered::Filter::Resonant_Highpass, samplerate);
    bank.highpass->frequency = 400.0f;
    bank.highpass->resonance = 0.12f;
    bank.highpass->enabled = true;

    bank.presence = new Superpowered::Filter(Superpowered::Filter::Parametric, samplerate);
    bank.presence->frequency = 1800.0f;
    bank.presence->octave = 1.2f;
    bank.presence->decibel = 4.0f * fxScale;
    bank.presence->enabled = true;

    bank.air = new Superpowered::Filter(Superpowered::Filter::Resonant_Lowpass, samplerate);
    bank.air->frequency = 3200.0f;
    bank.air->resonance = 0.12f;
    bank.air->enabled = true;
  } else {
    // vocal-clarity (default) — Voloco Vocal Clarity
    bank.highpass = new Superpowered::Filter(Superpowered::Filter::Resonant_Highpass, samplerate);
    bank.highpass->frequency = 80.0f;
    bank.highpass->resonance = 0.1f;
    bank.highpass->enabled = true;

    bank.mudCut = new Superpowered::Filter(Superpowered::Filter::Parametric, samplerate);
    bank.mudCut->frequency = 250.0f;
    bank.mudCut->octave = 0.8f;
    bank.mudCut->decibel = fxAware ? -3.0f : -3.5f;
    bank.mudCut->enabled = true;

    bank.presence = new Superpowered::Filter(Superpowered::Filter::Parametric, samplerate);
    bank.presence->frequency = 3200.0f;
    bank.presence->octave = 0.85f;
    bank.presence->decibel = fxAware ? 2.5f : 3.2f;
    bank.presence->enabled = true;

    bank.hiShelf = new Superpowered::Filter(Superpowered::Filter::HighShelf, samplerate);
    bank.hiShelf->frequency = 9000.0f;
    bank.hiShelf->slope = 0.5f;
    bank.hiShelf->decibel = fxAware ? 0.8f : 1.2f;
    bank.hiShelf->enabled = true;

    bank.sibilanceTame = new Superpowered::Filter(Superpowered::Filter::Parametric, samplerate);
    bank.sibilanceTame->frequency = 7800.0f;
    bank.sibilanceTame->octave = 0.5f;
    bank.sibilanceTame->decibel = fxAware ? -2.0f : -1.5f;
    bank.sibilanceTame->enabled = true;
  }

  // Client tune overrides (native dB values).
  if (spec.hasBassDb) {
    if (bank.lowShelf == nullptr) {
      bank.lowShelf = new Superpowered::Filter(Superpowered::Filter::LowShelf, samplerate);
      bank.lowShelf->frequency = 160.0f;
      bank.lowShelf->slope = 0.5f;
      bank.lowShelf->enabled = true;
    }
    bank.lowShelf->decibel = clampf(spec.bassDb, -9.0f, 9.0f);
  }
  if (spec.hasMudDb) {
    if (bank.mudCut == nullptr) {
      bank.mudCut = new Superpowered::Filter(Superpowered::Filter::Parametric, samplerate);
      bank.mudCut->frequency = 250.0f;
      bank.mudCut->octave = 0.8f;
      bank.mudCut->enabled = true;
    }
    bank.mudCut->decibel = clampf(spec.mudDb, -9.0f, 0.0f);
  }
  if (spec.hasPresenceDb) {
    if (bank.presence == nullptr) {
      bank.presence = new Superpowered::Filter(Superpowered::Filter::Parametric, samplerate);
      bank.presence->frequency = 3200.0f;
      bank.presence->octave = 0.85f;
      bank.presence->enabled = true;
    }
    bank.presence->decibel = clampf(spec.presenceDb, -4.0f, 8.0f);
  }
  if (spec.hasBrightDb) {
    if (bank.hiShelf == nullptr) {
      bank.hiShelf = new Superpowered::Filter(Superpowered::Filter::HighShelf, samplerate);
      bank.hiShelf->frequency = 6500.0f;
      bank.hiShelf->slope = 0.5f;
      bank.hiShelf->enabled = true;
    }
    bank.hiShelf->decibel = clampf(spec.brightDb, -6.0f, 6.0f);
  }
  if (spec.hasHarshDb) {
    if (bank.sibilanceTame == nullptr) {
      bank.sibilanceTame = new Superpowered::Filter(Superpowered::Filter::Parametric, samplerate);
      bank.sibilanceTame->frequency = 7800.0f;
      bank.sibilanceTame->octave = 0.5f;
      bank.sibilanceTame->enabled = true;
    }
    bank.sibilanceTame->decibel = clampf(spec.harshDb, -6.0f, 0.0f);
  }

  EFFECTS_LOG(
    "eq preset=%s tuned=%d bass=%.1f mud=%.1f presence=%.1f bright=%.1f harsh=%.1f",
    preset.c_str(),
    (spec.hasBassDb || spec.hasMudDb || spec.hasPresenceDb || spec.hasBrightDb ||
     spec.hasHarshDb)
      ? 1
      : 0,
    bank.lowShelf != nullptr ? bank.lowShelf->decibel : 0.0f,
    bank.mudCut != nullptr ? bank.mudCut->decibel : 0.0f,
    bank.presence != nullptr ? bank.presence->decibel : 0.0f,
    bank.hiShelf != nullptr ? bank.hiShelf->decibel : 0.0f,
    bank.sibilanceTame != nullptr ? bank.sibilanceTame->decibel : 0.0f);

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

Superpowered::AutomaticVocalPitchCorrection::TunerClamp parseAutotuneClamp(
  const std::string &speed,
  const std::string &scale
) {
  using Clamp = Superpowered::AutomaticVocalPitchCorrection::TunerClamp;
  if (speed == "SUBTLE") {
    return Clamp::LOOSE;
  }
  if (speed == "MEDIUM") {
    return Clamp::TIGHT;
  }
  if (speed == "EXTREME") {
    // Always TIGHT — clamp OFF tears consonants and low notes into crackle.
    return Clamp::TIGHT;
  }
  return Clamp::TIGHT;
}

Superpowered::AutomaticVocalPitchCorrection::TunerRange parseAutotuneRange(
  const std::string &speed
) {
  using Range = Superpowered::AutomaticVocalPitchCorrection::TunerRange;
  // WIDE covers low and high voices (40–3000 Hz); TENOR breaks low pitches.
  (void)speed;
  return Range::WIDE;
}

/** Autotune chip — user scale + speed. */
Superpowered::AutomaticVocalPitchCorrection *buildAutotune(
  const EffectSpec &spec,
  unsigned int samplerate
) {
  Superpowered::AutomaticVocalPitchCorrection *autotune =
    new Superpowered::AutomaticVocalPitchCorrection();
  autotune->samplerate = samplerate;
  autotune->scale = parseAutotuneScale(spec.scale);
  autotune->speed = parseAutotuneSpeed(spec.speed);
  autotune->range = parseAutotuneRange(spec.speed);
  autotune->clamp = parseAutotuneClamp(spec.speed, spec.scale);
  autotune->frequencyOfA = 440.0f;
  return autotune;
}

/**
 * FX Hard/Natural Snap — Superpowered AVPC only (no TimeStretching, no FxPost).
 * Pipeline for FX: AVPC → (optional mix chips) → light limiter.
 * TIGHT clamp protects consonants; LOOSE/OFF was crackle-prone.
 */
Superpowered::AutomaticVocalPitchCorrection *buildFx(
  const EffectSpec &spec,
  unsigned int samplerate
) {
  using Clamp = Superpowered::AutomaticVocalPitchCorrection::TunerClamp;
  using Range = Superpowered::AutomaticVocalPitchCorrection::TunerRange;
  using Speed = Superpowered::AutomaticVocalPitchCorrection::TunerSpeed;

  Superpowered::AutomaticVocalPitchCorrection *fx =
    new Superpowered::AutomaticVocalPitchCorrection();
  fx->samplerate = samplerate;
  fx->scale = parseAutotuneScale(spec.scale.empty() ? "CMAJOR" : spec.scale);
  fx->range = Range::WIDE;
  fx->frequencyOfA = 440.0f;

  // Defaults from preset, then optional JSON speed/clamp overrides.
  if (spec.preset == "natural-snap") {
    fx->speed = Speed::SUBTLE;
    fx->clamp = Clamp::TIGHT;
  } else {
    fx->speed = Speed::MEDIUM;
    fx->clamp = Clamp::TIGHT;
  }

  if (spec.speed == "SUBTLE") {
    fx->speed = Speed::SUBTLE;
  } else if (spec.speed == "MEDIUM") {
    fx->speed = Speed::MEDIUM;
  } else if (spec.speed == "EXTREME") {
    fx->speed = Speed::EXTREME;
  }

  if (spec.clamp == "LOOSE") {
    fx->clamp = Clamp::LOOSE;
  } else if (spec.clamp == "TIGHT") {
    fx->clamp = Clamp::TIGHT;
  }

  EFFECTS_LOG(
    "fx preset=%s scale=%s speed=%s clamp=%s",
    spec.preset.c_str(),
    spec.scale.c_str(),
    spec.speed.c_str(),
    spec.clamp.c_str());

  return fx;
}

Superpowered::Compressor *buildCompressor(
  const EffectSpec &spec,
  unsigned int samplerate,
  bool denseStack,
  bool fxAware
) {
  Superpowered::Compressor *compressor = new Superpowered::Compressor(samplerate);
  compressor->hpCutOffHz = 80.0f;
  compressor->attackSec = fxAware ? 0.014f : 0.010f;
  compressor->releaseSec = 0.22f;
  compressor->enabled = true;

  const float makeupScale = denseStack ? 0.7f : (fxAware ? 0.85f : 1.0f);
  const std::string &preset = spec.preset;

  if (preset == "blasted") {
    compressor->inputGainDb = denseStack ? 0.0f : (1.0f * makeupScale);
    compressor->outputGainDb = denseStack ? (1.2f * makeupScale) : (1.5f * makeupScale);
    compressor->thresholdDb = denseStack ? -20.0f : -22.0f;
    compressor->ratio = denseStack ? 5.0f : 6.0f;
    compressor->wet = denseStack ? 0.72f : 1.0f;
    compressor->attackSec = 0.008f;
  } else if (preset == "rap") {
    compressor->inputGainDb = 0.8f * makeupScale;
    compressor->outputGainDb = 1.2f * makeupScale;
    compressor->thresholdDb = -18.0f;
    compressor->ratio = 3.5f;
    compressor->wet = 1.0f;
  } else if (preset == "pop") {
    compressor->inputGainDb = 0.8f * makeupScale;
    compressor->outputGainDb = 1.2f * makeupScale;
    compressor->thresholdDb = -17.0f;
    compressor->ratio = 3.5f;
    compressor->wet = 0.80f;
  } else if (preset == "parallel") {
    compressor->inputGainDb = 1.0f * makeupScale;
    compressor->outputGainDb = 1.0f * makeupScale;
    compressor->thresholdDb = -16.0f;
    compressor->ratio = 3.0f;
    compressor->wet = 0.50f;
  } else {
    compressor->inputGainDb = 0.5f * makeupScale;
    compressor->outputGainDb = 0.8f * makeupScale;
    compressor->thresholdDb = -14.0f;
    compressor->ratio = 2.0f;
    compressor->wet = 0.55f;
  }

  if (spec.hasThresholdDb) {
    compressor->thresholdDb = clampf(spec.thresholdDb, -28.0f, -6.0f);
  }
  if (spec.hasRatio) {
    compressor->ratio = clampf(spec.ratio, 1.5f, 10.0f);
  }
  if (spec.hasWet) {
    compressor->wet = clampf(spec.wet, 0.0f, 1.0f);
  }
  if (spec.hasOutputGainDb) {
    compressor->outputGainDb = clampf(spec.outputGainDb, 0.0f, 4.0f);
  }
  if (spec.hasAttackSec) {
    compressor->attackSec = clampf(spec.attackSec, 0.003f, 0.040f);
  }

  EFFECTS_LOG(
    "compressor preset=%s thr=%.1f ratio=%.2f wet=%.2f outGain=%.2f attack=%.3f tuned=%d",
    preset.c_str(),
    compressor->thresholdDb,
    compressor->ratio,
    compressor->wet,
    compressor->outputGainDb,
    compressor->attackSec,
    (spec.hasThresholdDb || spec.hasRatio || spec.hasWet || spec.hasOutputGainDb ||
     spec.hasAttackSec)
      ? 1
      : 0);

  return compressor;
}

struct StereoEchoEngine {
  std::vector<float> delayL;
  std::vector<float> delayR;
  size_t writePos = 0;
  size_t capacity = 0;
  unsigned int samplerate = 48000;
  bool active = false;

  bool tempoSync = true;
  float bpm = 120.0f;
  float leftDelay = 0.5f;
  float rightDelay = 0.5f;
  float leftFeedback = 0.35f;
  float rightFeedback = 0.35f;
  float xoverFeedback = 0.0f;
  float dryLevel = 1.0f;
  float wetLevel = 0.5f;
  float duckDelay = 0.35f;
  float duckEnv = 0.0f;

  void destroy() {
    delayL.clear();
    delayR.clear();
    capacity = 0;
    writePos = 0;
    duckEnv = 0.0f;
    active = false;
  }

  void ensureCapacity(unsigned int sr) {
    samplerate = sr;
    const size_t need = static_cast<size_t>(sr) * 4u + 16u; // ~4s headroom
    if (need <= capacity) {
      return;
    }
    delayL.assign(need, 0.0f);
    delayR.assign(need, 0.0f);
    capacity = need;
    writePos = 0;
    duckEnv = 0.0f;
  }

  float delayToMs(float value) const {
    if (tempoSync) {
      const float beats = clampf(value, 0.03125f, 2.0f);
      return beats * (60000.0f / clampf(bpm, 40.0f, 250.0f));
    }
    return clampf(value, 1.0f, 2000.0f);
  }

  void processInPlace(float *buffer, unsigned int frames) {
    if (!active || buffer == nullptr || frames == 0) {
      return;
    }
    ensureCapacity(samplerate);

    const size_t leftSamples = static_cast<size_t>(
      clampf(delayToMs(leftDelay) * 0.001f * static_cast<float>(samplerate), 1.0f, static_cast<float>(capacity - 1))
    );
    const size_t rightSamples = static_cast<size_t>(
      clampf(delayToMs(rightDelay) * 0.001f * static_cast<float>(samplerate), 1.0f, static_cast<float>(capacity - 1))
    );

    const float dry = clampf(dryLevel, 0.0f, 1.0f);
    const float wet = clampf(wetLevel, 0.0f, 1.0f);
    const float fbL = clampf(leftFeedback, 0.0f, 0.95f);
    const float fbR = clampf(rightFeedback, 0.0f, 0.95f);
    const float xover = clampf(xoverFeedback, 0.0f, 0.95f);
    const float duckAmt = clampf(duckDelay, 0.0f, 1.0f);

    for (unsigned int i = 0; i < frames; ++i) {
      float inL = buffer[i * 2];
      float inR = buffer[i * 2 + 1];
      const float monoIn = 0.5f * (inL + inR);

      const float peak = std::fabs(monoIn);
      if (peak > duckEnv) {
        duckEnv = peak;
      } else {
        duckEnv *= 0.995f;
      }
      const float duckGain = 1.0f - duckAmt * clampf(duckEnv * 2.2f, 0.0f, 1.0f);

      const size_t readL = (writePos + capacity - leftSamples) % capacity;
      const size_t readR = (writePos + capacity - rightSamples) % capacity;
      const float delayedL = delayL[readL];
      const float delayedR = delayR[readR];

      float newL = monoIn + delayedL * fbL + delayedR * xover;
      float newR = monoIn + delayedR * fbR + delayedL * xover;
      newL = clampf(newL, -1.5f, 1.5f);
      newR = clampf(newR, -1.5f, 1.5f);
      delayL[writePos] = newL;
      delayR[writePos] = newR;
      writePos = (writePos + 1) % capacity;

      buffer[i * 2] = inL * dry + delayedL * wet * duckGain;
      buffer[i * 2 + 1] = inR * dry + delayedR * wet * duckGain;
    }
  }
};

struct ReverbSend {
  Superpowered::Reverb *reverb = nullptr;
  float sendGain = 0.18f;

  void destroy() {
    delete reverb;
    reverb = nullptr;
  }
};

StereoEchoEngine buildStereoEcho(const EffectSpec &spec, unsigned int samplerate) {
  StereoEchoEngine echo;
  echo.active = true;
  echo.samplerate = samplerate;
  echo.bpm = 120.0f;

  const bool hasVoloco =
    spec.hasWetLevel || spec.hasLeftDelay || spec.hasRightDelay || spec.hasLeftFeedback ||
    spec.hasRightFeedback || spec.hasXoverFeedback || spec.hasDryLevel || spec.hasDuckDelay;

  if (hasVoloco) {
    echo.tempoSync = spec.hasTempoSync ? spec.tempoSync : true;
    echo.duckDelay = spec.hasDuckDelay ? clampf(spec.duckDelay, 0.0f, 1.0f) : 0.35f;
    echo.leftDelay = spec.hasLeftDelay ? spec.leftDelay : 0.5f;
    echo.rightDelay = spec.hasRightDelay ? spec.rightDelay : echo.leftDelay;
    echo.leftFeedback =
      spec.hasLeftFeedback ? clampf(spec.leftFeedback, 0.0f, 0.95f) : 0.35f;
    echo.rightFeedback =
      spec.hasRightFeedback ? clampf(spec.rightFeedback, 0.0f, 0.95f) : echo.leftFeedback;
    echo.xoverFeedback =
      spec.hasXoverFeedback ? clampf(spec.xoverFeedback, 0.0f, 0.95f) : 0.0f;
    echo.dryLevel = spec.hasDryLevel ? clampf(spec.dryLevel, 0.0f, 1.0f) : 1.0f;
    echo.wetLevel = spec.hasWetLevel ? clampf(spec.wetLevel, 0.0f, 1.0f) : 0.5f;
  } else {
    // Legacy sendGain/beats/decay → Voloco-shaped defaults by preset name.
    echo.tempoSync = true;
    echo.duckDelay = 0.35f;
    echo.dryLevel = 1.0f;
    echo.leftDelay = spec.hasBeats ? clampf(spec.beats, 0.03125f, 2.0f) : 0.5f;
    echo.rightDelay = echo.leftDelay;
    echo.leftFeedback = spec.hasDecay ? clampf(spec.decay, 0.0f, 0.95f) : 0.35f;
    echo.rightFeedback = echo.leftFeedback;
    echo.xoverFeedback = 0.0f;
    echo.wetLevel = spec.hasSendGain
      ? clampf(spec.sendGain, 0.0f, 1.0f)
      : clampf(spec.intensity / 100.0f, 0.0f, 1.0f);

    const std::string &preset = spec.preset;
    if (preset == "resonant-buzz") {
      echo.leftDelay = echo.rightDelay = 0.125f;
      echo.leftFeedback = echo.rightFeedback = 0.10f;
      echo.xoverFeedback = 0.0f;
      echo.duckDelay = 0.20f;
      if (!spec.hasSendGain) {
        echo.wetLevel = 0.45f;
      }
    } else if (preset == "eighth-note-bounce") {
      echo.leftDelay = echo.rightDelay = 0.5f;
      echo.leftFeedback = echo.rightFeedback = 0.30f;
      echo.xoverFeedback = 0.10f;
      echo.duckDelay = 0.40f;
      if (!spec.hasSendGain) {
        echo.wetLevel = 0.50f;
      }
    } else if (preset == "slinky") {
      echo.leftDelay = echo.rightDelay = 0.75f;
      echo.leftFeedback = echo.rightFeedback = 0.60f;
      echo.xoverFeedback = 0.15f;
      echo.duckDelay = 0.25f;
      if (!spec.hasSendGain) {
        echo.wetLevel = 0.55f;
      }
    } else if (preset == "right-to-left") {
      echo.leftDelay = 0.5f;
      echo.rightDelay = 0.75f;
      echo.leftFeedback = echo.rightFeedback = 0.22f;
      echo.xoverFeedback = 0.55f;
      echo.duckDelay = 0.35f;
      if (!spec.hasSendGain) {
        echo.wetLevel = 0.50f;
      }
    } else {
      // coin-drop / default
      echo.leftDelay = 0.25f;
      echo.rightDelay = 0.28f;
      echo.leftFeedback = echo.rightFeedback = 0.35f;
      echo.xoverFeedback = 0.30f;
      echo.duckDelay = 0.20f;
      if (!spec.hasSendGain) {
        echo.wetLevel = 0.65f;
      }
    }
  }

  EFFECTS_LOG(
    "echo voloco preset=%s sync=%d L=%.3f R=%.3f fbL=%.2f fbR=%.2f xover=%.2f dry=%.2f wet=%.2f duck=%.2f",
    spec.preset.c_str(),
    echo.tempoSync ? 1 : 0,
    echo.leftDelay,
    echo.rightDelay,
    echo.leftFeedback,
    echo.rightFeedback,
    echo.xoverFeedback,
    echo.dryLevel,
    echo.wetLevel,
    echo.duckDelay);

  echo.ensureCapacity(samplerate);
  return echo;
}

ReverbSend buildReverbSend(
  const EffectSpec &spec,
  unsigned int samplerate
) {
  ReverbSend send;
  send.reverb = new Superpowered::Reverb(samplerate);
  send.reverb->enabled = true;
  send.reverb->dry = 0.0f;
  send.reverb->wet = 1.0f;

  if (spec.hasSendGain) {
    send.sendGain = clampf(spec.sendGain, 0.0f, 0.95f);
  } else {
    send.sendGain = clampf(spec.amount / 100.0f, 0.0f, 0.95f);
  }

  const std::string &preset = spec.preset;
  if (preset == "cathedral") {
    send.reverb->roomSize = 0.92f;
    send.reverb->damp = 0.38f;
    send.reverb->width = 1.0f;
    send.reverb->predelayMs = 42.0f;
    send.reverb->lowCutHz = 180.0f;
    if (!spec.hasSendGain) {
      send.sendGain = clampf(send.sendGain > 0.01f ? send.sendGain : 0.72f, 0.0f, 0.90f);
    }
  } else if (preset == "large-hall") {
    send.reverb->roomSize = 0.82f;
    send.reverb->damp = 0.42f;
    send.reverb->width = 1.0f;
    send.reverb->predelayMs = 32.0f;
    send.reverb->lowCutHz = 200.0f;
    if (!spec.hasSendGain) {
      send.sendGain = clampf(send.sendGain > 0.01f ? send.sendGain : 0.64f, 0.0f, 0.85f);
    }
  } else if (preset == "stereo-width") {
    send.reverb->roomSize = 0.52f;
    send.reverb->damp = 0.40f;
    send.reverb->width = 1.0f;
    send.reverb->predelayMs = 18.0f;
    send.reverb->lowCutHz = 230.0f;
    if (!spec.hasSendGain) {
      send.sendGain = clampf(send.sendGain > 0.01f ? send.sendGain : 0.50f, 0.0f, 0.75f);
    }
  } else if (preset == "long-narrow") {
    send.reverb->roomSize = 0.70f;
    send.reverb->damp = 0.58f;
    send.reverb->width = 0.35f;
    send.reverb->predelayMs = 48.0f;
    send.reverb->lowCutHz = 270.0f;
    if (!spec.hasSendGain) {
      send.sendGain = clampf(send.sendGain > 0.01f ? send.sendGain : 0.58f, 0.0f, 0.80f);
    }
  } else if (preset == "small-club") {
    send.reverb->roomSize = 0.28f;
    send.reverb->damp = 0.60f;
    send.reverb->width = 0.75f;
    send.reverb->predelayMs = 10.0f;
    send.reverb->lowCutHz = 260.0f;
    if (!spec.hasSendGain) {
      send.sendGain = clampf(send.sendGain > 0.01f ? send.sendGain : 0.38f, 0.0f, 0.55f);
    }
  } else {
    send.reverb->roomSize = 0.50f;
    send.reverb->damp = 0.52f;
    send.reverb->width = 0.90f;
    send.reverb->predelayMs = 22.0f;
    send.reverb->lowCutHz = 250.0f;
    if (!spec.hasSendGain) {
      send.sendGain = clampf(send.sendGain > 0.01f ? send.sendGain : 0.48f, 0.0f, 0.70f);
    }
  }

  if (spec.hasRoomSize) {
    send.reverb->roomSize = clampf(spec.roomSize, 0.15f, 0.95f);
  }
  if (spec.hasDamp) {
    send.reverb->damp = clampf(spec.damp, 0.15f, 0.90f);
  }
  if (spec.hasWidth) {
    send.reverb->width = clampf(spec.width, 0.25f, 1.0f);
  }
  if (spec.hasPredelayMs) {
    send.reverb->predelayMs = clampf(spec.predelayMs, 0.0f, 80.0f);
  }
  if (spec.hasLowCutHz) {
    send.reverb->lowCutHz = clampf(spec.lowCutHz, 120.0f, 400.0f);
  }

  EFFECTS_LOG(
    "reverb preset=%s sendGain=%.3f (tuned=%d) room=%.3f damp=%.3f width=%.3f predelay=%.1f lowCut=%.1f",
    preset.c_str(),
    send.sendGain,
    spec.hasSendGain ? 1 : 0,
    send.reverb->roomSize,
    send.reverb->damp,
    send.reverb->width,
    send.reverb->predelayMs,
    send.reverb->lowCutHz);

  return send;
}

void sumSendIntoDry(
  float *dry,
  const float *wet,
  unsigned int frames,
  float sendGain
) {
  // Preset character mix: wet stays obvious at Voloco-style sends; duck dry so
  // small-club vs cathedral / short vs long echo remain night-and-day.
  const float wetGain = clampf(sendGain, 0.0f, 0.95f);
  const float dryKeep = 1.0f - wetGain * 0.65f;
  const unsigned int samples = frames * 2;
  for (unsigned int i = 0; i < samples; ++i) {
    dry[i] = dry[i] * dryKeep + wet[i] * wetGain;
  }
}

/** Peak already in ~[-12, -3] dBFS → leave alone; else scale toward -6 dBFS (0.5). */
float computeInputNormalizeGain(float peak) {
  if (peak < 1e-8f) {
    return 1.0f;
  }
  const float safeLo = 0.251189f; // -12 dBFS
  const float safeHi = 0.707946f; // -3 dBFS
  if (peak >= safeLo && peak <= safeHi) {
    return 1.0f;
  }
  const float target = 0.5f; // -6 dBFS
  return target / peak;
}

void applyGain(float *buffer, unsigned int frames, float gain) {
  if (std::fabs(gain - 1.0f) < 1e-6f) {
    return;
  }
  const unsigned int samples = frames * 2;
  for (unsigned int i = 0; i < samples; ++i) {
    buffer[i] *= gain;
  }
}

float bufferPeak(const float *buffer, unsigned int frames) {
  float peak = 0.0f;
  const unsigned int samples = frames * 2;
  for (unsigned int i = 0; i < samples; ++i) {
    const float a = std::fabs(buffer[i]);
    if (a > peak) {
      peak = a;
    }
  }
  return peak;
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
  EFFECTS_LOG(
    "processFile tune-overrides v3 apply-only-lab json=%s",
    effectsJson != nullptr ? effectsJson : "");

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

  Superpowered::AutomaticVocalPitchCorrection *pitch = nullptr;
  bool pitchIsFx = false;
  Superpowered::Compressor *compressor = nullptr;
  EqBank eqBank;
  StereoEchoEngine stereoEcho;
  ReverbSend reverbSend;
  Superpowered::Limiter *limiter = nullptr;

  bool wantsPitchFx = false;
  bool wantsPitchAutotune = false;
  bool wantsComp = false;
  bool wantsEq = false;
  bool wantsEcho = false;
  bool wantsReverb = false;
  for (const EffectSpec &spec : specs) {
    if (spec.id == "fx") {
      wantsPitchFx = true;
    } else if (spec.id == "autotune") {
      wantsPitchAutotune = true;
    } else if (spec.id == "compressor") {
      wantsComp = true;
    } else if (spec.id == "eq") {
      wantsEq = true;
    } else if (spec.id == "echo") {
      wantsEcho = true;
    } else if (spec.id == "reverb") {
      wantsReverb = true;
    }
  }
  const bool wantsPitch = wantsPitchFx || wantsPitchAutotune;
  const int mixStages =
    (wantsComp ? 1 : 0) + (wantsEq ? 1 : 0) + (wantsEcho ? 1 : 0) + (wantsReverb ? 1 : 0);
  const bool denseStack =
    mixStages >= 3 || (wantsPitch && wantsComp && wantsEq) ||
    (wantsComp && wantsEq && (wantsEcho || wantsReverb));
  const bool fxAware = wantsPitchFx;

  // Prefer FX AVPC over Autotune if both appear (JS should only send one).
  auto buildPitchFromSpecs = [&]() {
    for (const EffectSpec &spec : specs) {
      if (spec.id == "fx" && pitch == nullptr) {
        EffectSpec fxSpec = spec;
        if (fxSpec.preset.empty()) {
          fxSpec.preset = "hard-snap";
        }
        if (fxSpec.scale.empty()) {
          fxSpec.scale = "CMAJOR";
        }
        pitch = buildFx(fxSpec, samplerate);
        pitchIsFx = true;
        break;
      }
    }
    if (pitch == nullptr) {
      for (const EffectSpec &spec : specs) {
        if (spec.id == "autotune") {
          pitch = buildAutotune(spec, samplerate);
          break;
        }
      }
    }
  };

  buildPitchFromSpecs();

  for (const EffectSpec &spec : specs) {
    if (spec.id == "compressor" && compressor == nullptr) {
      EffectSpec compSpec = spec;
      if (compSpec.preset.empty()) {
        compSpec.preset = "moderate";
      }
      compressor = buildCompressor(compSpec, samplerate, denseStack, fxAware);
    } else if (spec.id == "eq" && eqBank.isEmpty()) {
      EffectSpec eqSpec = spec;
      if (eqSpec.preset.empty()) {
        eqSpec.preset = "vocal-clarity";
      }
      eqBank = buildEqBank(eqSpec, samplerate, fxAware);
    } else if (spec.id == "echo" && !stereoEcho.active) {
      stereoEcho = buildStereoEcho(spec, samplerate);
    } else if (spec.id == "reverb" && reverbSend.reverb == nullptr) {
      reverbSend = buildReverbSend(spec, samplerate);
    }
  }

  // Dense mix-only stacks: pull Echo/Reverb so space doesn't crackle into the limiter.
  // Skip when Voloco wetLevel was explicitly provided.
  if (denseStack && !pitchIsFx) {
    bool echoTuned = false;
    bool reverbTuned = false;
    for (const EffectSpec &spec : specs) {
      if (spec.id == "echo" && (spec.hasWetLevel || spec.hasSendGain)) {
        echoTuned = true;
      }
      if (spec.id == "reverb" && spec.hasSendGain) {
        reverbTuned = true;
      }
    }
    const float sendScale = 0.80f;
    if (!echoTuned && stereoEcho.active) {
      stereoEcho.wetLevel *= sendScale;
    }
    if (!reverbTuned && reverbSend.reverb != nullptr) {
      reverbSend.sendGain *= sendScale;
    }
    EFFECTS_LOG(
      "denseStack sendScale applied echo=%d reverb=%d finalEchoWet=%.3f finalReverb=%.3f",
      echoTuned ? 0 : 1,
      reverbTuned ? 0 : 1,
      stereoEcho.wetLevel,
      reverbSend.sendGain);
  }

  if (pitch != nullptr || compressor != nullptr || !eqBank.isEmpty() ||
      stereoEcho.active || reverbSend.reverb != nullptr) {
    limiter = new Superpowered::Limiter(samplerate);
    limiter->ceilingDb = -1.0f;
    // FX-only: more headroom so exports aren't slammed (Voloco peak ~0.39)
    const bool fxOnly =
      pitchIsFx && compressor == nullptr && eqBank.isEmpty() && !stereoEcho.active &&
      reverbSend.reverb == nullptr;
    if (fxOnly) {
      // FX = AVPC + light limiter only (no FxPost). Keep headroom so exports stay clean.
      limiter->ceilingDb = -8.3f;
      limiter->thresholdDb = -9.0f;
      limiter->releaseSec = 0.10f;
    } else if (denseStack && !pitchIsFx) {
      // Mix-only dense stack: more headroom after normalize + calmer sends
      limiter->ceilingDb = -1.5f;
      limiter->thresholdDb = -5.0f;
      limiter->releaseSec = 0.10f;
    } else if (!pitchIsFx) {
      // Mix with normalize: lighter limiting when gain staging is under control
      limiter->ceilingDb = -1.0f;
      limiter->thresholdDb = denseStack ? -3.8f : -2.5f;
      limiter->releaseSec = 0.08f;
    } else {
      // FX + mix chips: AVPC then mix; moderate headroom
      limiter->thresholdDb = denseStack ? -4.0f : -3.2f;
      limiter->releaseSec = 0.08f;
    }
    limiter->enabled = true;
  }

  const unsigned int framesPerChunk = decoder->getFramesPerChunk();
  short int *intBuffer = (short int *)std::malloc(framesPerChunk * 2 * sizeof(short int) + 16384);
  float *floatBuffer = (float *)std::malloc(framesPerChunk * 2 * sizeof(float) + 16384);
  float *dryBuffer = (float *)std::malloc(framesPerChunk * 2 * sizeof(float) + 16384);
  float *wetBuffer = (float *)std::malloc(framesPerChunk * 2 * sizeof(float) + 16384);

  if (intBuffer == nullptr || floatBuffer == nullptr || dryBuffer == nullptr ||
      wetBuffer == nullptr) {
    setError("Out of memory allocating audio buffers.");
    std::free(intBuffer);
    std::free(floatBuffer);
    std::free(dryBuffer);
    std::free(wetBuffer);
    delete limiter;
    delete pitch;
    delete compressor;
    eqBank.destroy();
    stereoEcho.destroy();
    reverbSend.destroy();
    Superpowered::closeWAV(destinationFile);
    delete decoder;
    return 6;
  }

  // -------------------------------------------------------------------------
  // Canonical offline order (user chip tap order is irrelevant):
  //   pitch (FX/Autotune AVPC only — no FxPost) → input-normalize → Comp → EQ
  //   → Echo send → Reverb send → limiter
  // FX-only path: AVPC → normalize → light limiter.
  // Pass 1: measure peak after pitch (or after decode if no pitch).
  // Pass 2: apply constant normalize gain, then mix stages.
  // -------------------------------------------------------------------------
  float filePeak = 0.0f;
  while (true) {
    int framesDecoded = decoder->decodeAudio(intBuffer, framesPerChunk);
    if (framesDecoded < 1) {
      break;
    }
    const unsigned int frames = (unsigned int)framesDecoded;
    Superpowered::ShortIntToFloat(intBuffer, floatBuffer, frames);
    if (pitch != nullptr) {
      pitch->samplerate = samplerate;
      pitch->process(floatBuffer, floatBuffer, true, frames);
    }
    const float chunkPeak = bufferPeak(floatBuffer, frames);
    if (chunkPeak > filePeak) {
      filePeak = chunkPeak;
    }
  }

  const float inputNormalizeGain = computeInputNormalizeGain(filePeak);

  // Rewind + rebuild pitch so pass 2 starts with clean processor state.
  if (!decoder->setPositionPrecise(0)) {
    setError("Could not rewind decoder for normalize pass.");
    std::free(intBuffer);
    std::free(floatBuffer);
    std::free(dryBuffer);
    std::free(wetBuffer);
    delete limiter;
    delete pitch;
    delete compressor;
    eqBank.destroy();
    stereoEcho.destroy();
    reverbSend.destroy();
    Superpowered::closeWAV(destinationFile);
    delete decoder;
    return 7;
  }
  delete pitch;
  pitch = nullptr;
  pitchIsFx = false;
  buildPitchFromSpecs();

  while (true) {
    int framesDecoded = decoder->decodeAudio(intBuffer, framesPerChunk);
    if (framesDecoded < 1) {
      break;
    }

    const unsigned int frames = (unsigned int)framesDecoded;
    Superpowered::ShortIntToFloat(intBuffer, floatBuffer, frames);

    // 1) Pitch: FX AVPC or Autotune AVPC (never both). No FxPost after FX.
    if (pitch != nullptr) {
      pitch->samplerate = samplerate;
      pitch->process(floatBuffer, floatBuffer, true, frames);
    }

    // 2) Input peak normalize (constant gain for whole file)
    applyGain(floatBuffer, frames, inputNormalizeGain);

    // 3) Comp
    if (compressor != nullptr) {
      compressor->samplerate = samplerate;
      compressor->process(floatBuffer, floatBuffer, frames);
    }
    // 4) EQ
    eqBank.process(floatBuffer, frames, samplerate);

    // 5) Voloco-style stereo echo (dry/wet + duck + L/R + x-over)
    // 6) Reverb send from pre-echo dry (parallel), then limiter
    if (stereoEcho.active || reverbSend.reverb != nullptr) {
      std::memcpy(dryBuffer, floatBuffer, frames * 2 * sizeof(float));

      if (stereoEcho.active) {
        stereoEcho.samplerate = samplerate;
        stereoEcho.processInPlace(floatBuffer, frames);
      }

      if (reverbSend.reverb != nullptr) {
        std::memcpy(wetBuffer, dryBuffer, frames * 2 * sizeof(float));
        reverbSend.reverb->samplerate = samplerate;
        reverbSend.reverb->process(wetBuffer, wetBuffer, frames);
        sumSendIntoDry(floatBuffer, wetBuffer, frames, reverbSend.sendGain);
      }
    }

    // 7) Limiter
    if (limiter != nullptr) {
      limiter->samplerate = samplerate;
      limiter->process(floatBuffer, floatBuffer, frames);
    }

    Superpowered::FloatToShortInt(floatBuffer, intBuffer, frames);
    Superpowered::writeWAV(destinationFile, intBuffer, frames * 4);
  }

  std::free(intBuffer);
  std::free(floatBuffer);
  std::free(dryBuffer);
  std::free(wetBuffer);
  delete limiter;
  delete pitch;
  delete compressor;
  eqBank.destroy();
  stereoEcho.destroy();
  reverbSend.destroy();
  Superpowered::closeWAV(destinationFile);
  delete decoder;

  setError(nullptr);
  return 0;
}
