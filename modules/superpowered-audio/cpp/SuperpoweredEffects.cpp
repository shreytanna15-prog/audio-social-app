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
      // Raised cap so Room/Hall/Soft Plate recipes can use stronger wet (≤0.45).
      spec.amount = clampf(readNumberParam(params, "amount", 28.0f), 0.0f, 45.0f);
      specs.push_back(spec);
    } else if (spec.id == "echo") {
      spec.delay = readNumberParam(params, "delay", 2.0f);
      // Raised cap so Slapback/Classic/Bounce recipes can use stronger wet (≤0.55).
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

EqBank buildEqBank(const std::string &preset, unsigned int samplerate, bool fxAware) {
  EqBank bank;
  const float fxScale = fxAware ? 0.75f : 1.0f;

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

  if (spec.preset == "natural-snap") {
    fx->speed = Speed::SUBTLE;
    fx->clamp = Clamp::TIGHT;
  } else {
    // Hard Snap: stronger than Natural but MEDIUM avoids EXTREME robot/steppy tone.
    fx->speed = Speed::MEDIUM;
    fx->clamp = Clamp::TIGHT;
  }
  return fx;
}

Superpowered::Compressor *buildCompressor(
  const std::string &preset,
  unsigned int samplerate,
  bool denseStack,
  bool fxAware
) {
  Superpowered::Compressor *compressor = new Superpowered::Compressor(samplerate);
  compressor->hpCutOffHz = 80.0f;
  compressor->attackSec = fxAware ? 0.014f : 0.010f;
  compressor->releaseSec = 0.22f;
  compressor->enabled = true;

  // Calm makeup — avoid double +2.5 dB slam that crackles into the limiter.
  const float makeupScale = denseStack ? 0.7f : (fxAware ? 0.85f : 1.0f);

  if (preset == "blasted") {
    // Dense stacks: parallel-style wet + single-sided makeup (no double in+out slam).
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
    // moderate (default)
    compressor->inputGainDb = 0.5f * makeupScale;
    compressor->outputGainDb = 0.8f * makeupScale;
    compressor->thresholdDb = -14.0f;
    compressor->ratio = 2.0f;
    compressor->wet = 0.55f;
  }

  return compressor;
}

struct EchoSend {
  Superpowered::Echo *echo = nullptr;
  Superpowered::Filter *colorHp = nullptr;
  Superpowered::Filter *colorLp = nullptr;
  float sendGain = 0.22f;

  void destroy() {
    delete echo;
    delete colorHp;
    delete colorLp;
    echo = nullptr;
    colorHp = nullptr;
    colorLp = nullptr;
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

EchoSend buildEchoSend(
  const EffectSpec &spec,
  unsigned int samplerate
) {
  EchoSend send;
  send.echo = new Superpowered::Echo(samplerate);
  send.echo->bpm = 120.0f;
  send.echo->enabled = true;
  // Wet-only send path
  send.echo->dry = 0.0f;
  send.echo->wet = 1.0f;

  float beats = 0.5f;
  float decay = 0.36f;
  send.sendGain = clampf(spec.intensity / 100.0f, 0.0f, 0.40f);

  const std::string &preset = spec.preset;
  if (preset == "resonant-buzz") {
    // Slapback — very short
    beats = 0.125f;
    decay = 0.14f;
    send.sendGain = clampf(send.sendGain > 0.01f ? send.sendGain : 0.18f, 0.0f, 0.28f);
  } else if (preset == "eighth-note-bounce") {
    beats = 0.5f;
    decay = 0.28f;
    send.sendGain = clampf(send.sendGain > 0.01f ? send.sendGain : 0.24f, 0.0f, 0.34f);
  } else if (preset == "slinky") {
    beats = 0.75f;
    decay = 0.48f;
    send.sendGain = clampf(send.sendGain > 0.01f ? send.sendGain : 0.24f, 0.0f, 0.34f);
  } else if (preset == "right-to-left") {
    // Ping-pong-ish within Superpowered Echo limits
    beats = 0.5f;
    decay = 0.34f;
    send.sendGain = clampf(send.sendGain > 0.01f ? send.sendGain : 0.22f, 0.0f, 0.32f);
  } else {
    // coin-drop — short, louder presence
    beats = 0.25f;
    decay = 0.30f;
    send.sendGain = clampf(send.sendGain > 0.01f ? send.sendGain : 0.28f, 0.0f, 0.36f);
  }

  send.echo->beats = beats;
  send.echo->decay = decay;

  send.colorHp = new Superpowered::Filter(Superpowered::Filter::Resonant_Highpass, samplerate);
  send.colorHp->frequency = 320.0f;
  send.colorHp->resonance = 0.1f;
  send.colorHp->enabled = true;

  send.colorLp = new Superpowered::Filter(Superpowered::Filter::Resonant_Lowpass, samplerate);
  send.colorLp->frequency = 4800.0f;
  send.colorLp->resonance = 0.12f;
  send.colorLp->enabled = true;

  return send;
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

  send.sendGain = clampf(spec.amount / 100.0f, 0.0f, 0.38f);

  const std::string &preset = spec.preset;
  if (preset == "cathedral") {
    send.reverb->roomSize = 0.82f;
    send.reverb->damp = 0.42f;
    send.reverb->width = 1.0f;
    send.reverb->predelayMs = 36.0f;
    send.reverb->lowCutHz = 200.0f;
    send.sendGain = clampf(send.sendGain > 0.01f ? send.sendGain : 0.26f, 0.0f, 0.34f);
  } else if (preset == "large-hall") {
    send.reverb->roomSize = 0.72f;
    send.reverb->damp = 0.48f;
    send.reverb->width = 1.0f;
    send.reverb->predelayMs = 30.0f;
    send.reverb->lowCutHz = 210.0f;
    send.sendGain = clampf(send.sendGain > 0.01f ? send.sendGain : 0.24f, 0.0f, 0.32f);
  } else if (preset == "stereo-width") {
    send.reverb->roomSize = 0.50f;
    send.reverb->damp = 0.45f;
    send.reverb->width = 1.0f;
    send.reverb->predelayMs = 20.0f;
    send.reverb->lowCutHz = 240.0f;
    send.sendGain = clampf(send.sendGain > 0.01f ? send.sendGain : 0.20f, 0.0f, 0.30f);
  } else if (preset == "long-narrow") {
    send.reverb->roomSize = 0.62f;
    send.reverb->damp = 0.55f;
    send.reverb->width = 0.45f;
    send.reverb->predelayMs = 40.0f;
    send.reverb->lowCutHz = 260.0f;
    send.sendGain = clampf(send.sendGain > 0.01f ? send.sendGain : 0.22f, 0.0f, 0.30f);
  } else if (preset == "small-club") {
    send.reverb->roomSize = 0.36f;
    send.reverb->damp = 0.55f;
    send.reverb->width = 0.80f;
    send.reverb->predelayMs = 14.0f;
    send.reverb->lowCutHz = 250.0f;
    send.sendGain = clampf(send.sendGain > 0.01f ? send.sendGain : 0.18f, 0.0f, 0.28f);
  } else {
    // medium-room
    send.reverb->roomSize = 0.48f;
    send.reverb->damp = 0.56f;
    send.reverb->width = 0.88f;
    send.reverb->predelayMs = 22.0f;
    send.reverb->lowCutHz = 260.0f;
    send.sendGain = clampf(send.sendGain > 0.01f ? send.sendGain : 0.19f, 0.0f, 0.28f);
  }

  return send;
}

void sumSendIntoDry(
  float *dry,
  const float *wet,
  unsigned int frames,
  float sendGain
) {
  const unsigned int samples = frames * 2;
  for (unsigned int i = 0; i < samples; ++i) {
    dry[i] += wet[i] * sendGain;
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
  EchoSend echoSend;
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
      compressor = buildCompressor(
        spec.preset.empty() ? "moderate" : spec.preset,
        samplerate,
        denseStack,
        fxAware
      );
    } else if (spec.id == "eq" && eqBank.isEmpty()) {
      eqBank = buildEqBank(
        spec.preset.empty() ? "vocal-clarity" : spec.preset,
        samplerate,
        fxAware
      );
    } else if (spec.id == "echo" && echoSend.echo == nullptr) {
      echoSend = buildEchoSend(spec, samplerate);
    } else if (spec.id == "reverb" && reverbSend.reverb == nullptr) {
      reverbSend = buildReverbSend(spec, samplerate);
    }
  }

  // Dense mix-only stacks: pull Echo/Reverb sends so space doesn't crackle into the limiter.
  if (denseStack && !pitchIsFx) {
    const float sendScale = 0.80f;
    echoSend.sendGain *= sendScale;
    reverbSend.sendGain *= sendScale;
  }

  if (pitch != nullptr || compressor != nullptr || !eqBank.isEmpty() ||
      echoSend.echo != nullptr || reverbSend.reverb != nullptr) {
    limiter = new Superpowered::Limiter(samplerate);
    limiter->ceilingDb = -1.0f;
    // FX-only: more headroom so exports aren't slammed (Voloco peak ~0.39)
    const bool fxOnly =
      pitchIsFx && compressor == nullptr && eqBank.isEmpty() && echoSend.echo == nullptr &&
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
    echoSend.destroy();
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
    echoSend.destroy();
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

    // 5–6) Send-style Echo / Reverb: keep dry clear, blend filtered wet
    if (echoSend.echo != nullptr || reverbSend.reverb != nullptr) {
      std::memcpy(dryBuffer, floatBuffer, frames * 2 * sizeof(float));

      if (echoSend.echo != nullptr) {
        std::memcpy(wetBuffer, dryBuffer, frames * 2 * sizeof(float));
        echoSend.echo->samplerate = samplerate;
        if (echoSend.colorHp != nullptr) {
          echoSend.colorHp->samplerate = samplerate;
          echoSend.echo->processWithFx(wetBuffer, wetBuffer, frames, echoSend.colorHp);
          if (echoSend.colorLp != nullptr) {
            echoSend.colorLp->samplerate = samplerate;
            echoSend.colorLp->process(wetBuffer, wetBuffer, frames);
          }
        } else {
          echoSend.echo->process(wetBuffer, wetBuffer, frames);
        }
        sumSendIntoDry(floatBuffer, wetBuffer, frames, echoSend.sendGain);
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
  echoSend.destroy();
  reverbSend.destroy();
  Superpowered::closeWAV(destinationFile);
  delete decoder;

  setError(nullptr);
  return 0;
}
