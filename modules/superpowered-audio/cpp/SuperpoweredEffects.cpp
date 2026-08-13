#include "SuperpoweredEffects.h"

#include <algorithm>
#include <cmath>
#include <cstdint>
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
#include "SuperpoweredCompressor.h"
#include "SuperpoweredDecoder.h"
#include "SuperpoweredFilter.h"
#include "SuperpoweredFlanger.h"
#include "SuperpoweredJSON.h"
#include "SuperpoweredLimiter.h"
#include "SuperpoweredPolish.h"
#include "SuperpoweredReverb.h"
#include "SuperpoweredSimple.h"
#include "MelodyRetune.h"

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
  bool hasTap1Ms = false;
  float tap1Ms = 23.0f;
  bool hasTap2Ms = false;
  float tap2Ms = 31.0f;
  bool hasLfoHz = false;
  float lfoHz = 0.38f;
  bool hasLfoDepthMs = false;
  float lfoDepthMs = 3.5f;
  bool hasCarrierHz = false;
  float carrierHz = 140.0f;
  bool hasStrength = false;
  float strength = 0.8f;
  bool hasSlewMs = false;
  float slewMs = 40.0f;
  bool hasVibratoCents = false;
  float vibratoCents = 18.0f;
  bool hasFormant = false;
  float formant = 1.0f;
  bool hasDepth = false;
  float depth = 0.45f;
  bool hasBits = false;
  float bits = 8.0f;
  bool hasCrushHz = false;
  float crushHz = 9500.0f;
  bool hasPitchCents = false;
  float pitchCents = 0.0f;
  bool hasInputGainDb = false;
  float inputGainDb = 0.0f;
  bool hasOutputGainDb = false;
  float outputGainDb = 0.0f;
  bool hasAttackSec = false;
  float attackSec = 0.01f;
  bool hasReleaseSec = false;
  float releaseSec = 0.22f;
  bool hasAutoThreshold = false;
  bool autoThreshold = true;
  bool hasThresholdDiffDb = false;
  float thresholdDiffDb = -4.0f;
  // Voloco Custom EQ
  bool hasHighPassHz = false;
  float highPassHz = 80.0f;
  bool hasDb200 = false;
  float db200 = 0.0f;
  bool hasDb500 = false;
  float db500 = 0.0f;
  bool hasDb1000 = false;
  float db1000 = 0.0f;
  bool hasDb2000 = false;
  float db2000 = 0.0f;
  bool hasDb3000 = false;
  float db3000 = 0.0f;
  bool hasDb4500 = false;
  float db4500 = 0.0f;
  bool hasDb8000 = false;
  float db8000 = 0.0f;
  bool hasHighShelfDb = false;
  float highShelfDb = 0.0f;
  bool hasMakeupGainDb = false;
  float makeupGainDb = 0.0f;
  // Legacy 5-knob EQ (migrated if Custom fields absent)
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
    spec.hasTap1Ms = readOptionalNumber(params, "tap1Ms", &spec.tap1Ms);
    spec.hasTap2Ms = readOptionalNumber(params, "tap2Ms", &spec.tap2Ms);
    spec.hasLfoHz = readOptionalNumber(params, "lfoHz", &spec.lfoHz);
    spec.hasLfoDepthMs = readOptionalNumber(params, "lfoDepthMs", &spec.lfoDepthMs);
    spec.hasCarrierHz = readOptionalNumber(params, "carrierHz", &spec.carrierHz);
    spec.hasStrength = readOptionalNumber(params, "strength", &spec.strength);
    spec.hasSlewMs = readOptionalNumber(params, "slewMs", &spec.slewMs);
    spec.hasVibratoCents = readOptionalNumber(params, "vibratoCents", &spec.vibratoCents);
    spec.hasFormant = readOptionalNumber(params, "formant", &spec.formant);
    spec.hasDepth = readOptionalNumber(params, "depth", &spec.depth);
    spec.hasBits = readOptionalNumber(params, "bits", &spec.bits);
    spec.hasCrushHz = readOptionalNumber(params, "crushHz", &spec.crushHz);
    spec.hasPitchCents = readOptionalNumber(params, "pitchCents", &spec.pitchCents);
    // Voloco "mix": reverb → send amount; compressor → wet/dry.
    {
      float mixVal = 0.0f;
      if (readOptionalNumber(params, "mix", &mixVal)) {
        if (spec.id == "reverb") {
          spec.hasSendGain = true;
          spec.sendGain = mixVal;
        } else if (spec.id == "compressor") {
          spec.hasWet = true;
          spec.wet = mixVal;
        }
      }
    }
    spec.hasInputGainDb = readOptionalNumber(params, "inputGainDb", &spec.inputGainDb);
    spec.hasOutputGainDb = readOptionalNumber(params, "outputGainDb", &spec.outputGainDb);
    spec.hasAttackSec = readOptionalNumber(params, "attackSec", &spec.attackSec);
    spec.hasReleaseSec = readOptionalNumber(params, "releaseSec", &spec.releaseSec);
    spec.hasThresholdDiffDb = readOptionalNumber(params, "thresholdDiffDb", &spec.thresholdDiffDb);
    if (params != nullptr) {
      Superpowered::json *autoNode = params->atKey("autoThreshold");
      if (autoNode != nullptr) {
        spec.hasAutoThreshold = true;
        if (autoNode->type == Superpowered::json::jbool) {
          spec.autoThreshold = autoNode->value.b != 0;
        } else if (autoNode->type == Superpowered::json::jint) {
          spec.autoThreshold = autoNode->value.i != 0;
        } else if (autoNode->type == Superpowered::json::jdouble) {
          spec.autoThreshold = autoNode->value.d != 0.0;
        } else if (
          autoNode->type == Superpowered::json::jstring && autoNode->value.string != nullptr
        ) {
          const char *s = autoNode->value.string;
          spec.autoThreshold =
            !(s[0] == '0' || s[0] == 'f' || s[0] == 'F' || s[0] == 'n' || s[0] == 'N');
        }
      }
    }
    spec.hasHighPassHz = readOptionalNumber(params, "highPassHz", &spec.highPassHz);
    spec.hasDb200 = readOptionalNumber(params, "db200", &spec.db200);
    spec.hasDb500 = readOptionalNumber(params, "db500", &spec.db500);
    spec.hasDb1000 = readOptionalNumber(params, "db1000", &spec.db1000);
    spec.hasDb2000 = readOptionalNumber(params, "db2000", &spec.db2000);
    spec.hasDb3000 = readOptionalNumber(params, "db3000", &spec.db3000);
    spec.hasDb4500 = readOptionalNumber(params, "db4500", &spec.db4500);
    spec.hasDb8000 = readOptionalNumber(params, "db8000", &spec.db8000);
    spec.hasHighShelfDb = readOptionalNumber(params, "highShelfDb", &spec.highShelfDb);
    spec.hasMakeupGainDb = readOptionalNumber(params, "makeupGainDb", &spec.makeupGainDb);
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
    } else if (spec.id == "eq" || spec.id == "compressor" || spec.id == "fx") {
      specs.push_back(spec);
    }
  }

  root->dealloc();
  return specs;
}

/** Voloco Custom EQ: HPF + 7 parametric bands + high shelf. */
struct EqBank {
  Superpowered::Filter *highpass = nullptr;
  Superpowered::Filter *band200 = nullptr;
  Superpowered::Filter *band500 = nullptr;
  Superpowered::Filter *band1000 = nullptr;
  Superpowered::Filter *band2000 = nullptr;
  Superpowered::Filter *band3000 = nullptr;
  Superpowered::Filter *band4500 = nullptr;
  Superpowered::Filter *band8000 = nullptr;
  Superpowered::Filter *hiShelf = nullptr;
  float makeupLinear = 1.0f;

  bool isEmpty() const {
    return highpass == nullptr && band200 == nullptr && band500 == nullptr &&
           band1000 == nullptr && band2000 == nullptr && band3000 == nullptr &&
           band4500 == nullptr && band8000 == nullptr && hiShelf == nullptr;
  }

  void destroy() {
    delete highpass;
    delete band200;
    delete band500;
    delete band1000;
    delete band2000;
    delete band3000;
    delete band4500;
    delete band8000;
    delete hiShelf;
    highpass = band200 = band500 = band1000 = band2000 = band3000 = band4500 =
      band8000 = hiShelf = nullptr;
    makeupLinear = 1.0f;
  }

  void process(float *buffer, unsigned int frames, unsigned int samplerate) {
    auto run = [buffer, frames, samplerate](Superpowered::Filter *f) {
      if (f == nullptr) {
        return;
      }
      f->samplerate = samplerate;
      f->process(buffer, buffer, frames);
    };
    run(highpass);
    run(band200);
    run(band500);
    run(band1000);
    run(band2000);
    run(band3000);
    run(band4500);
    run(band8000);
    run(hiShelf);

    if (std::fabs(makeupLinear - 1.0f) > 1e-6f) {
      const unsigned int samples = frames * 2;
      for (unsigned int i = 0; i < samples; ++i) {
        buffer[i] *= makeupLinear;
      }
    }
  }

  /** Scale boosts only (positive dB) so stacked chains stay clear. */
  void scaleBoosts(float factor) {
    auto scale = [factor](Superpowered::Filter *f) {
      if (f != nullptr && f->decibel > 0.0f) {
        f->decibel *= factor;
      }
    };
    scale(band200);
    scale(band500);
    scale(band1000);
    scale(band2000);
    scale(band3000);
    scale(band4500);
    scale(band8000);
    scale(hiShelf);
  }
};

static Superpowered::Filter *makeParametricBand(
  unsigned int samplerate,
  float frequencyHz,
  float gainDb,
  float octave
) {
  auto *filter = new Superpowered::Filter(Superpowered::Filter::Parametric, samplerate);
  filter->frequency = frequencyHz;
  filter->octave = octave;
  filter->decibel = gainDb;
  filter->enabled = true;
  return filter;
}

static float scalePositiveDb(float db, float fxScale) {
  if (db > 0.0f) {
    return db * fxScale;
  }
  return db;
}

EqBank buildEqBank(const EffectSpec &spec, unsigned int samplerate, bool fxAware) {
  EqBank bank;
  const float fxScale = fxAware ? 0.75f : 1.0f;
  const std::string preset = spec.preset.empty() ? "vocal-clarity" : spec.preset;

  const bool hasCustom =
    spec.hasHighPassHz || spec.hasDb200 || spec.hasDb500 || spec.hasDb1000 ||
    spec.hasDb2000 || spec.hasDb3000 || spec.hasDb4500 || spec.hasDb8000 ||
    spec.hasHighShelfDb || spec.hasMakeupGainDb;

  float highPassHz = 80.0f;
  float db200 = 0.0f;
  float db500 = 0.0f;
  float db1000 = 0.0f;
  float db2000 = 0.0f;
  float db3000 = 0.0f;
  float db4500 = 0.0f;
  float db8000 = 0.0f;
  float highShelfDb = 0.0f;
  float makeupGainDb = 0.0f;

  if (hasCustom) {
    highPassHz = spec.hasHighPassHz ? spec.highPassHz : 80.0f;
    db200 = spec.hasDb200 ? spec.db200 : 0.0f;
    db500 = spec.hasDb500 ? spec.db500 : 0.0f;
    db1000 = spec.hasDb1000 ? spec.db1000 : 0.0f;
    db2000 = spec.hasDb2000 ? spec.db2000 : 0.0f;
    db3000 = spec.hasDb3000 ? spec.db3000 : 0.0f;
    db4500 = spec.hasDb4500 ? spec.db4500 : 0.0f;
    db8000 = spec.hasDb8000 ? spec.db8000 : 0.0f;
    highShelfDb = spec.hasHighShelfDb ? spec.highShelfDb : 0.0f;
    makeupGainDb = spec.hasMakeupGainDb ? spec.makeupGainDb : 0.0f;
  } else if (
    spec.hasBassDb || spec.hasMudDb || spec.hasPresenceDb || spec.hasBrightDb ||
    spec.hasHarshDb
  ) {
    // Approximate legacy 5-knob EQ into Custom bands.
    const float bass = spec.hasBassDb ? spec.bassDb : 0.0f;
    const float mud = spec.hasMudDb ? spec.mudDb : 0.0f;
    const float presence = spec.hasPresenceDb ? spec.presenceDb : 0.0f;
    const float bright = spec.hasBrightDb ? spec.brightDb : 0.0f;
    const float harsh = spec.hasHarshDb ? spec.harshDb : 0.0f;
    highPassHz = 80.0f;
    db200 = bass * 0.6f + mud * 0.4f;
    db500 = mud;
    db1000 = presence * 0.25f;
    db2000 = presence * 0.55f;
    db3000 = presence * 0.7f;
    db4500 = bright * 0.45f + harsh * 0.3f;
    db8000 = bright * 0.7f + harsh * 0.5f;
    highShelfDb = clampf(bright * 0.35f, -0.6f, 6.0f);
    makeupGainDb = 0.0f;
  } else if (preset == "mid-range-scoop") {
    highPassHz = 60.0f;
    db200 = 5.0f;
    db500 = -8.0f;
    db1000 = -7.5f;
    db2000 = -5.0f;
    db3000 = -1.5f;
    db4500 = 3.5f;
    db8000 = 4.5f;
    highShelfDb = 3.5f;
    makeupGainDb = 3.5f;
  } else if (preset == "brightness") {
    highPassHz = 90.0f;
    db200 = -1.0f;
    db500 = -1.5f;
    db1000 = 0.5f;
    db2000 = 1.5f;
    db3000 = 3.5f;
    db4500 = 5.5f;
    db8000 = 7.0f;
    highShelfDb = 5.5f;
    makeupGainDb = 2.5f;
  } else if (preset == "low-high-boost") {
    highPassHz = 50.0f;
    db200 = 5.5f;
    db500 = 2.0f;
    db1000 = 1.0f;
    db2000 = 0.5f;
    db3000 = 1.0f;
    db4500 = 3.0f;
    db8000 = 4.5f;
    highShelfDb = 4.0f;
    makeupGainDb = 1.5f;
  } else if (preset == "telephone") {
    highPassHz = 450.0f;
    db200 = -12.0f;
    db500 = -3.0f;
    db1000 = 5.0f;
    db2000 = 6.0f;
    db3000 = 4.0f;
    db4500 = -8.0f;
    db8000 = -12.0f;
    highShelfDb = -0.6f;
    makeupGainDb = 2.0f;
  } else {
    // vocal-clarity
    highPassHz = 85.0f;
    db200 = -2.5f;
    db500 = -3.0f;
    db1000 = 1.0f;
    db2000 = 3.5f;
    db3000 = 4.5f;
    db4500 = 2.0f;
    db8000 = 1.0f;
    highShelfDb = 1.2f;
    makeupGainDb = 1.5f;
  }

  highPassHz = clampf(highPassHz, 40.0f, 1000.0f);
  db200 = clampf(db200, -12.0f, 12.0f);
  db500 = clampf(db500, -12.0f, 12.0f);
  db1000 = clampf(db1000, -12.0f, 12.0f);
  db2000 = clampf(db2000, -12.0f, 12.0f);
  db3000 = clampf(db3000, -12.0f, 12.0f);
  db4500 = clampf(db4500, -12.0f, 12.0f);
  db8000 = clampf(db8000, -12.0f, 12.0f);
  highShelfDb = clampf(highShelfDb, -0.6f, 6.0f);
  makeupGainDb = clampf(makeupGainDb, 0.0f, 6.0f);

  bank.highpass = new Superpowered::Filter(Superpowered::Filter::Resonant_Highpass, samplerate);
  bank.highpass->frequency = highPassHz;
  bank.highpass->resonance = 0.1f;
  bank.highpass->enabled = true;

  // ~2/3 octave Q keeps bands musical and Voloco-like.
  const float bandOctave = 0.75f;
  bank.band200 =
    makeParametricBand(samplerate, 200.0f, scalePositiveDb(db200, fxScale), bandOctave);
  bank.band500 =
    makeParametricBand(samplerate, 500.0f, scalePositiveDb(db500, fxScale), bandOctave);
  bank.band1000 =
    makeParametricBand(samplerate, 1000.0f, scalePositiveDb(db1000, fxScale), bandOctave);
  bank.band2000 =
    makeParametricBand(samplerate, 2000.0f, scalePositiveDb(db2000, fxScale), bandOctave);
  bank.band3000 =
    makeParametricBand(samplerate, 3000.0f, scalePositiveDb(db3000, fxScale), bandOctave);
  bank.band4500 =
    makeParametricBand(samplerate, 4500.0f, scalePositiveDb(db4500, fxScale), bandOctave);
  bank.band8000 =
    makeParametricBand(samplerate, 8000.0f, scalePositiveDb(db8000, fxScale), 0.65f);

  bank.hiShelf = new Superpowered::Filter(Superpowered::Filter::HighShelf, samplerate);
  bank.hiShelf->frequency = 8000.0f;
  bank.hiShelf->slope = 0.5f;
  bank.hiShelf->decibel = scalePositiveDb(highShelfDb, fxScale);
  bank.hiShelf->enabled = true;
  bank.makeupLinear = std::pow(10.0f, makeupGainDb / 20.0f);

  EFFECTS_LOG(
    "eq preset=%s custom=%d hpf=%.0f 200=%.1f 500=%.1f 1k=%.1f 2k=%.1f 3k=%.1f 4.5k=%.1f 8k=%.1f shelf=%.1f makeup=%.1f",
    preset.c_str(),
    hasCustom ? 1 : 0,
    highPassHz,
    db200,
    db500,
    db1000,
    db2000,
    db3000,
    db4500,
    db8000,
    highShelfDb,
    makeupGainDb);

  return bank;
}

enum class FxStageKind { None, MelodyRetune, Flanger };

bool isFxMelodyPreset(const std::string &preset) {
  return preset == "hard-tune" || preset == "natural-tune";
}

bool isFxStockPreset(const std::string &preset) {
  return isFxMelodyPreset(preset) || preset == "big-chorus";
}

struct FxStage {
  FxStageKind kind = FxStageKind::None;
  MelodyRetuneEngine melody;
  Superpowered::Flanger *flanger = nullptr;

  bool isActive() const { return kind != FxStageKind::None; }
  bool isMelody() const { return kind == FxStageKind::MelodyRetune; }

  void destroy() {
    melody.destroy();
    delete flanger;
    flanger = nullptr;
    kind = FxStageKind::None;
  }

  void process(float *buffer, unsigned int frames, unsigned int samplerate) {
    if (buffer == nullptr || frames == 0) {
      return;
    }
    if (kind == FxStageKind::MelodyRetune) {
      melody.process(buffer, frames);
      return;
    }
    if (kind == FxStageKind::Flanger && flanger != nullptr) {
      flanger->samplerate = samplerate;
      flanger->process(buffer, buffer, frames);
    }
  }
};

FxStage buildFxMelody(const EffectSpec &spec, unsigned int samplerate) {
  FxStage stage;
  stage.kind = FxStageKind::MelodyRetune;
  MelodyRetuneParams rp;
  if (spec.preset == "hard-tune") {
    rp.strength = spec.hasStrength ? spec.strength : 0.92f;
    rp.slewMs = spec.hasSlewMs ? spec.slewMs : 1.0f;
    rp.vibratoCents = spec.hasVibratoCents ? spec.vibratoCents : 0.0f;
    rp.wet = spec.hasWet ? spec.wet : 0.85f;
  } else {
    // natural-tune
    rp.strength = spec.hasStrength ? spec.strength : 0.68f;
    rp.slewMs = spec.hasSlewMs ? spec.slewMs : 40.0f;
    rp.vibratoCents = spec.hasVibratoCents ? spec.vibratoCents : 18.0f;
    rp.wet = spec.hasWet ? spec.wet : 0.75f;
  }
  stage.melody.reset(samplerate, rp);
  EFFECTS_LOG(
    "fx %s melody strength=%.2f slew=%.1f vib=%.1f wet=%.2f",
    spec.preset.c_str(),
    rp.strength,
    rp.slewMs,
    rp.vibratoCents,
    rp.wet);
  return stage;
}

FxStage buildFxFlanger(const EffectSpec &spec, unsigned int samplerate) {
  FxStage stage;
  stage.kind = FxStageKind::Flanger;
  stage.flanger = new Superpowered::Flanger(samplerate);
  stage.flanger->enabled = true;
  stage.flanger->stereo = true;
  stage.flanger->wet = spec.hasWet ? clampf(spec.wet, 0.4f, 1.0f) : 0.7f;
  stage.flanger->depth = spec.hasDepth ? clampf(spec.depth, 0.1f, 1.0f) : 0.45f;
  stage.flanger->bpm = 120.0f;
  stage.flanger->lfoBeats = 16.0f;
  EFFECTS_LOG(
    "fx big-chorus flanger wet=%.2f depth=%.2f",
    stage.flanger->wet,
    stage.flanger->depth);
  return stage;
}

/** Dispatcher: melody retune | big-chorus. Clean / unknown = no-op. */
FxStage buildFxStage(const EffectSpec &spec, unsigned int samplerate) {
  if (isFxMelodyPreset(spec.preset)) {
    return buildFxMelody(spec, samplerate);
  }
  if (spec.preset == "big-chorus") {
    return buildFxFlanger(spec, samplerate);
  }
  EFFECTS_LOG("fx preset=%s no-op (unknown or pass-through)", spec.preset.c_str());
  return FxStage();
}

Superpowered::Compressor *buildCompressor(
  const EffectSpec &spec,
  unsigned int samplerate,
  bool denseStack,
  bool fxAware
) {
  Superpowered::Compressor *compressor = new Superpowered::Compressor(samplerate);
  compressor->hpCutOffHz = 80.0f;
  compressor->enabled = true;

  const float makeupScale = denseStack ? 0.7f : (fxAware ? 0.85f : 1.0f);
  const std::string &preset = spec.preset;

  // Defaults from free preset character (overridden by Voloco Custom params).
  float mix = 0.55f;
  float inputGainDb = 0.5f * makeupScale;
  float outputGainDb = 0.8f * makeupScale;
  float attackSec = fxAware ? 0.014f : 0.010f;
  float releaseSec = 0.22f;
  float ratio = 2.0f;
  float thresholdDb = -14.0f;
  float thresholdDiffDb = -3.0f;
  bool autoThreshold = true;

  if (preset == "blasted") {
    mix = 1.0f;
    inputGainDb = denseStack ? 3.5f : 6.0f;
    outputGainDb = denseStack ? 2.5f : 3.5f;
    attackSec = 0.004f;
    releaseSec = 0.12f;
    ratio = 10.0f;
    thresholdDb = -24.0f;
    thresholdDiffDb = -11.0f;
  } else if (preset == "rap") {
    mix = 1.0f;
    inputGainDb = 4.0f * makeupScale;
    outputGainDb = 3.0f * makeupScale;
    attackSec = 0.005f;
    releaseSec = 0.14f;
    ratio = 5.0f;
    thresholdDb = -20.0f;
    thresholdDiffDb = -8.5f;
  } else if (preset == "pop") {
    mix = 0.88f;
    inputGainDb = 2.0f * makeupScale;
    outputGainDb = 2.5f * makeupScale;
    attackSec = 0.018f;
    releaseSec = 0.3f;
    ratio = 3.0f;
    thresholdDb = -16.0f;
    thresholdDiffDb = -4.5f;
  } else if (preset == "parallel") {
    mix = 0.38f;
    inputGainDb = 5.5f * makeupScale;
    outputGainDb = 2.0f * makeupScale;
    attackSec = 0.007f;
    releaseSec = 0.16f;
    ratio = 5.0f;
    thresholdDb = -18.0f;
    thresholdDiffDb = -7.0f;
  } else {
    // moderate
    mix = 0.32f;
    inputGainDb = 0.5f * makeupScale;
    outputGainDb = 1.5f * makeupScale;
    attackSec = 0.028f;
    releaseSec = 0.4f;
    ratio = 2.0f;
    thresholdDb = -12.0f;
    thresholdDiffDb = -1.0f;
  }

  const bool hasCustom =
    spec.hasWet || spec.hasInputGainDb || spec.hasOutputGainDb || spec.hasAttackSec ||
    spec.hasReleaseSec || spec.hasRatio || spec.hasThresholdDb || spec.hasAutoThreshold ||
    spec.hasThresholdDiffDb;

  if (hasCustom) {
    if (spec.hasWet) {
      mix = spec.wet;
    }
    if (spec.hasInputGainDb) {
      inputGainDb = spec.inputGainDb;
    }
    if (spec.hasOutputGainDb) {
      outputGainDb = spec.outputGainDb;
    }
    if (spec.hasAttackSec) {
      attackSec = spec.attackSec;
    }
    if (spec.hasReleaseSec) {
      releaseSec = spec.releaseSec;
    }
    if (spec.hasRatio) {
      ratio = spec.ratio;
    }
    if (spec.hasThresholdDb) {
      thresholdDb = spec.thresholdDb;
    }
    if (spec.hasAutoThreshold) {
      autoThreshold = spec.autoThreshold;
    }
    if (spec.hasThresholdDiffDb) {
      thresholdDiffDb = spec.thresholdDiffDb;
    }
  }

  compressor->wet = clampf(mix, 0.0f, 1.0f);
  compressor->inputGainDb = clampf(inputGainDb, -24.0f, 24.0f);
  compressor->outputGainDb = clampf(outputGainDb, -24.0f, 24.0f);
  compressor->attackSec = clampf(attackSec, 0.001f, 1.0f);
  // Superpowered Compressor release floor is 0.1s.
  compressor->releaseSec = clampf(releaseSec, 0.1f, 4.0f);
  compressor->ratio = clampf(ratio, 1.5f, 10.0f);
  // Manual threshold for now; auto mode is applied after pass-1 loudness measure.
  compressor->thresholdDb = clampf(thresholdDb, -40.0f, 0.0f);

  EFFECTS_LOG(
    "compressor preset=%s mix=%.2f in=%.1f out=%.1f atk=%.3f rel=%.3f ratio=%.1f thr=%.1f auto=%d diff=%.1f custom=%d",
    preset.c_str(),
    compressor->wet,
    compressor->inputGainDb,
    compressor->outputGainDb,
    compressor->attackSec,
    compressor->releaseSec,
    compressor->ratio,
    compressor->thresholdDb,
    autoThreshold ? 1 : 0,
    thresholdDiffDb,
    hasCustom ? 1 : 0);

  return compressor;
}

static bool compressorWantsAutoThreshold(const EffectSpec &spec) {
  if (spec.hasAutoThreshold) {
    return spec.autoThreshold;
  }
  // Free presets default to Auto Threshold on.
  return true;
}

static float compressorThresholdDiffDb(const EffectSpec &spec) {
  if (spec.hasThresholdDiffDb) {
    return clampf(spec.thresholdDiffDb, -12.0f, 12.0f);
  }
  if (spec.preset == "blasted") {
    return -11.0f;
  }
  if (spec.preset == "rap") {
    return -8.5f;
  }
  if (spec.preset == "parallel") {
    return -7.0f;
  }
  if (spec.preset == "pop") {
    return -4.5f;
  }
  return -1.0f;
}

static void applyCompressorAutoThreshold(
  Superpowered::Compressor *compressor,
  const EffectSpec &spec,
  float inputLoudnessDb
) {
  if (compressor == nullptr || !compressorWantsAutoThreshold(spec)) {
    return;
  }
  const float diff = compressorThresholdDiffDb(spec);
  compressor->thresholdDb = clampf(inputLoudnessDb + diff, -40.0f, 0.0f);
  EFFECTS_LOG(
    "compressor autoThreshold loudness=%.1f diff=%.1f -> thr=%.1f",
    inputLoudnessDb,
    diff,
    compressor->thresholdDb);
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
  // 100% wet engine; Mix is applied in sumSendIntoDry (Voloco wet/dry).
  send.reverb->dry = 0.0f;
  send.reverb->wet = 1.0f;

  const std::string &preset = spec.preset;
  float mix = 0.28f;
  float roomSize = 0.50f;
  float damp = 0.55f;
  float width = 0.85f;
  float predelayMs = 25.0f;

  if (preset == "cathedral") {
    mix = 0.45f;
    roomSize = 0.95f;
    damp = 0.62f;
    width = 1.0f;
    predelayMs = 52.0f;
  } else if (preset == "large-hall") {
    mix = 0.42f;
    roomSize = 0.85f;
    damp = 0.36f;
    width = 0.95f;
    predelayMs = 32.0f;
  } else if (preset == "stereo-width") {
    mix = 0.32f;
    roomSize = 0.48f;
    damp = 0.48f;
    width = 1.0f;
    predelayMs = 18.0f;
  } else if (preset == "long-narrow") {
    mix = 0.38f;
    roomSize = 0.78f;
    damp = 0.30f;
    width = 0.18f;
    predelayMs = 70.0f;
  } else if (preset == "small-club") {
    mix = 0.16f;
    roomSize = 0.22f;
    damp = 0.78f;
    width = 0.65f;
    predelayMs = 8.0f;
  } else {
    // medium-room
    mix = 0.26f;
    roomSize = 0.48f;
    damp = 0.55f;
    width = 0.80f;
    predelayMs = 22.0f;
  }

  const bool hasCustom =
    spec.hasSendGain || spec.hasRoomSize || spec.hasDamp || spec.hasWidth ||
    spec.hasPredelayMs;

  if (hasCustom) {
    if (spec.hasSendGain) {
      mix = spec.sendGain;
    }
    if (spec.hasRoomSize) {
      roomSize = spec.roomSize;
    }
    if (spec.hasDamp) {
      damp = spec.damp;
    }
    if (spec.hasWidth) {
      width = spec.width;
    }
    if (spec.hasPredelayMs) {
      predelayMs = spec.predelayMs;
    }
  } else if (!spec.hasSendGain && spec.amount > 0.0f) {
    // Legacy amount (0–100) → mix
    mix = clampf(spec.amount / 100.0f, 0.0f, 1.0f);
  }

  send.sendGain = clampf(mix, 0.0f, 1.0f);
  send.reverb->roomSize = clampf(roomSize, 0.0f, 1.0f);
  send.reverb->damp = clampf(damp, 0.0f, 1.0f);
  send.reverb->width = clampf(width, 0.0f, 1.0f);
  send.reverb->predelayMs = clampf(predelayMs, 0.0f, 500.0f);
  // Light low-cut; Cathedral gets a bit more to stop stuck tonal ring in the tail.
  send.reverb->lowCutHz = (preset == "cathedral") ? 280.0f : 160.0f;

  EFFECTS_LOG(
    "reverb preset=%s mix=%.3f room=%.3f damp=%.3f width=%.3f predelay=%.1f custom=%d",
    preset.c_str(),
    send.sendGain,
    send.reverb->roomSize,
    send.reverb->damp,
    send.reverb->width,
    send.reverb->predelayMs,
    hasCustom ? 1 : 0);

  return send;
}

void sumSendIntoDry(
  float *dry,
  const float *wet,
  unsigned int frames,
  float sendGain
) {
  // Voloco Mix: wet/dry blend. Mild dry duck keeps space obvious without washout.
  const float wetGain = clampf(sendGain, 0.0f, 1.0f);
  const float dryKeep = 1.0f - wetGain * 0.55f;
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

  Superpowered::Compressor *compressor = nullptr;
  EffectSpec compressorSpec;
  bool hasCompressorSpec = false;
  FxStage fxStage;
  EqBank eqBank;
  StereoEchoEngine stereoEcho;
  ReverbSend reverbSend;
  Superpowered::Limiter *limiter = nullptr;

  bool wantsFx = false;
  bool wantsComp = false;
  bool wantsEq = false;
  bool wantsEcho = false;
  bool wantsReverb = false;
  for (const EffectSpec &spec : specs) {
    if (spec.id == "fx" && isFxStockPreset(spec.preset)) {
      wantsFx = true;
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
  const bool wantsPitch = wantsFx;
  const int mixStages =
    (wantsComp ? 1 : 0) + (wantsEq ? 1 : 0) + (wantsEcho ? 1 : 0) + (wantsReverb ? 1 : 0);
  const bool denseStack =
    mixStages >= 3 || (wantsPitch && wantsComp && wantsEq) ||
    (wantsComp && wantsEq && (wantsEcho || wantsReverb));
  const bool fxAware = wantsFx;

  auto buildFxFromSpecs = [&]() {
    for (const EffectSpec &spec : specs) {
      if (spec.id == "fx") {
        fxStage = buildFxStage(spec, samplerate);
        if (fxStage.isActive()) {
          return;
        }
      }
    }
  };

  buildFxFromSpecs();

  for (const EffectSpec &spec : specs) {
    if (spec.id == "compressor" && compressor == nullptr) {
      EffectSpec compSpec = spec;
      if (compSpec.preset.empty()) {
        compSpec.preset = "moderate";
      }
      compressorSpec = compSpec;
      hasCompressorSpec = true;
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
  if (denseStack && !fxStage.isMelody()) {
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

  if (fxStage.isActive() || compressor != nullptr || !eqBank.isEmpty() ||
      stereoEcho.active || reverbSend.reverb != nullptr) {
    limiter = new Superpowered::Limiter(samplerate);
    limiter->ceilingDb = -1.0f;
    const bool melodyOnly =
      fxStage.isMelody() && compressor == nullptr && eqBank.isEmpty() && !stereoEcho.active &&
      reverbSend.reverb == nullptr;
    if (melodyOnly) {
      limiter->ceilingDb = -8.3f;
      limiter->thresholdDb = -9.0f;
      limiter->releaseSec = 0.10f;
    } else if (denseStack && !fxStage.isMelody()) {
      limiter->ceilingDb = -1.5f;
      limiter->thresholdDb = -5.0f;
      limiter->releaseSec = 0.10f;
    } else if (!fxStage.isMelody()) {
      limiter->ceilingDb = -1.0f;
      limiter->thresholdDb = denseStack ? -3.8f : -2.5f;
      limiter->releaseSec = 0.08f;
    } else {
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
  float *workBuffer = (float *)std::malloc(framesPerChunk * 2 * sizeof(float) + 16384);
  float *monoBuffer = (float *)std::malloc(framesPerChunk * sizeof(float) + 16384);

  if (intBuffer == nullptr || floatBuffer == nullptr || dryBuffer == nullptr ||
      wetBuffer == nullptr || workBuffer == nullptr || monoBuffer == nullptr) {
    setError("Out of memory allocating audio buffers.");
    std::free(intBuffer);
    std::free(floatBuffer);
    std::free(dryBuffer);
    std::free(wetBuffer);
    std::free(workBuffer);
    std::free(monoBuffer);
    delete limiter;
    fxStage.destroy();
    delete compressor;
    eqBank.destroy();
    stereoEcho.destroy();
    reverbSend.destroy();
    Superpowered::closeWAV(destinationFile);
    delete decoder;
    return 6;
  }

  if (fxStage.isMelody()) {
    while (true) {
      int framesDecoded = decoder->decodeAudio(intBuffer, framesPerChunk);
      if (framesDecoded < 1) {
        break;
      }
      const unsigned int frames = (unsigned int)framesDecoded;
      Superpowered::ShortIntToFloat(intBuffer, floatBuffer, frames);
      fxStage.melody.addAnalysis(floatBuffer, frames);
    }
    fxStage.melody.finishAnalysis();
    if (!decoder->setPositionPrecise(0)) {
      setError("Could not rewind decoder after melody analysis.");
      std::free(intBuffer);
      std::free(floatBuffer);
      std::free(dryBuffer);
      std::free(wetBuffer);
      std::free(workBuffer);
      std::free(monoBuffer);
      delete limiter;
      fxStage.destroy();
      delete compressor;
      eqBank.destroy();
      stereoEcho.destroy();
      reverbSend.destroy();
      Superpowered::closeWAV(destinationFile);
      delete decoder;
      return 7;
    }
    fxStage.melody.resetApply();
  }

  // -------------------------------------------------------------------------
  // Canonical offline order (user chip tap order is irrelevant):
  //   FX (melody / Flanger) → input-normalize → Comp → EQ
  //   → Echo send → Reverb send → limiter
  // Pass 1: measure peak after FX (or after decode if none).
  // Pass 2: apply constant normalize gain, then mix stages.
  // -------------------------------------------------------------------------
  auto applyFx = [&](float *buffer, unsigned int frames) {
    if (fxStage.isActive()) {
      fxStage.process(buffer, frames, samplerate);
    }
  };

  float filePeak = 0.0f;
  double sumSquares = 0.0;
  uint64_t sampleCount = 0;
  if (fxStage.isMelody()) {
    // Peak from already-rendered wet — skip a full second decode.
    fxStage.melody.measureRendered(&filePeak, &sumSquares, &sampleCount);
  } else {
    while (true) {
      int framesDecoded = decoder->decodeAudio(intBuffer, framesPerChunk);
      if (framesDecoded < 1) {
        break;
      }
      const unsigned int frames = (unsigned int)framesDecoded;
      Superpowered::ShortIntToFloat(intBuffer, floatBuffer, frames);
      applyFx(floatBuffer, frames);
      const float chunkPeak = bufferPeak(floatBuffer, frames);
      if (chunkPeak > filePeak) {
        filePeak = chunkPeak;
      }
      const unsigned int samples = frames * 2;
      for (unsigned int i = 0; i < samples; ++i) {
        const double s = (double)floatBuffer[i];
        sumSquares += s * s;
      }
      sampleCount += samples;
    }

    if (!decoder->setPositionPrecise(0)) {
      setError("Could not rewind decoder for normalize pass.");
      std::free(intBuffer);
      std::free(floatBuffer);
      std::free(dryBuffer);
      std::free(wetBuffer);
      std::free(workBuffer);
      std::free(monoBuffer);
      delete limiter;
      fxStage.destroy();
      delete compressor;
      eqBank.destroy();
      stereoEcho.destroy();
      reverbSend.destroy();
      Superpowered::closeWAV(destinationFile);
      delete decoder;
      return 7;
    }
  }

  const float inputNormalizeGain = computeInputNormalizeGain(filePeak);
  float inputLoudnessDb = -18.0f;
  if (sampleCount > 0) {
    const float rms = (float)std::sqrt(sumSquares / (double)sampleCount);
    const float rmsAfterNorm = rms * inputNormalizeGain;
    inputLoudnessDb = 20.0f * std::log10(std::max(rmsAfterNorm, 1.0e-8f));
  }
  if (hasCompressorSpec) {
    applyCompressorAutoThreshold(compressor, compressorSpec, inputLoudnessDb);
  }

  // Rebuild FX so pass 2 starts with clean processor state (melody: just rewind read).
  if (fxStage.isMelody()) {
    fxStage.melody.resetApply();
  } else {
    fxStage.destroy();
    buildFxFromSpecs();
  }

  auto mixAndWriteChunk = [&](float *buffer, unsigned int frames) {
    applyGain(buffer, frames, inputNormalizeGain);

    if (compressor != nullptr) {
      compressor->samplerate = samplerate;
      compressor->process(buffer, buffer, frames);
    }
    eqBank.process(buffer, frames, samplerate);

    if (stereoEcho.active || reverbSend.reverb != nullptr) {
      std::memcpy(dryBuffer, buffer, frames * 2 * sizeof(float));

      if (stereoEcho.active) {
        stereoEcho.samplerate = samplerate;
        stereoEcho.processInPlace(buffer, frames);
      }

      if (reverbSend.reverb != nullptr) {
        std::memcpy(wetBuffer, dryBuffer, frames * 2 * sizeof(float));
        reverbSend.reverb->samplerate = samplerate;
        reverbSend.reverb->process(wetBuffer, wetBuffer, frames);
        sumSendIntoDry(buffer, wetBuffer, frames, reverbSend.sendGain);
      }
    }

    if (limiter != nullptr) {
      limiter->samplerate = samplerate;
      limiter->process(buffer, buffer, frames);
    }

    Superpowered::FloatToShortInt(buffer, intBuffer, frames);
    Superpowered::writeWAV(destinationFile, intBuffer, frames * 4);
  };

  if (fxStage.isMelody()) {
    // Write from rendered wet only — no third decode.
    unsigned int remaining = fxStage.melody.renderedFrames();
    while (remaining > 0) {
      const unsigned int frames = std::min(framesPerChunk, remaining);
      std::memset(floatBuffer, 0, frames * 2 * sizeof(float));
      fxStage.melody.process(floatBuffer, frames);
      mixAndWriteChunk(floatBuffer, frames);
      remaining -= frames;
    }
  } else {
    while (true) {
      int framesDecoded = decoder->decodeAudio(intBuffer, framesPerChunk);
      if (framesDecoded < 1) {
        break;
      }
      const unsigned int frames = (unsigned int)framesDecoded;
      Superpowered::ShortIntToFloat(intBuffer, floatBuffer, frames);
      applyFx(floatBuffer, frames);
      mixAndWriteChunk(floatBuffer, frames);
    }
  }

  std::free(intBuffer);
  std::free(floatBuffer);
  std::free(dryBuffer);
  std::free(wetBuffer);
  std::free(workBuffer);
  std::free(monoBuffer);
  delete limiter;
  fxStage.destroy();
  delete compressor;
  eqBank.destroy();
  stereoEcho.destroy();
  reverbSend.destroy();
  Superpowered::closeWAV(destinationFile);
  delete decoder;

  setError(nullptr);
  return 0;
}
