#include "SuperpoweredPolish.h"

#include <algorithm>
#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <string>
#include <vector>

#include "Superpowered.h"
#include "SuperpoweredCompressor.h"
#include "SuperpoweredDecoder.h"
#include "SuperpoweredFilter.h"
#include "SuperpoweredLimiter.h"
#include "SuperpoweredSimple.h"

namespace {

char gLastError[512] = {0};
bool gInitialized = false;

void setError(const char *message) {
  if (message == nullptr) {
    gLastError[0] = '\0';
    return;
  }
  std::snprintf(gLastError, sizeof(gLastError), "%s", message);
}

float dbToLinear(float db) {
  return std::pow(10.0f, db / 20.0f);
}

float linearToDb(float linear) {
  const float safe = std::max(linear, 1.0e-8f);
  return 20.0f * std::log10(safe);
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

/**
 * Offline instrument cleaner (not Superpowered::Gate — that is rhythmic stutter).
 *
 * Pass-1 adaptive noise floor → look-ahead two-stage expander → HF duck in gaps.
 * Protects piano: soft knee near music, deep cut only in clear silence/gaps.
 */
struct InstrumentCleaner {
  float softThresholdLinear = dbToLinear(-42.0f);
  float hardThresholdLinear = dbToLinear(-52.0f);
  float softMinGainLinear = dbToLinear(-10.0f);
  float hardMinGainLinear = dbToLinear(-32.0f);
  float attackCoef = 0.0f;
  float releaseCoef = 0.0f;
  float wet = 0.88f;
  float hfDuckAmount = 0.55f; // 0..1 extra high-frequency cut when closed
  float envelope = 0.0f;
  float hfStateL = 0.0f;
  float hfStateR = 0.0f;
  float hfLpCoef = 0.0f;
  bool enabled = false;

  std::vector<float> delayL;
  std::vector<float> delayR;
  unsigned int delayLen = 0;
  unsigned int delayWrite = 0;
  unsigned int delayFilled = 0;

  void configure(
    unsigned int samplerate,
    float softThresholdDb,
    float hardThresholdDb,
    float softRangeDb,
    float hardRangeDb,
    float attackSec,
    float releaseSec,
    float wetMix,
    float hfDuck,
    float lookAheadSec
  ) {
    softThresholdLinear = dbToLinear(softThresholdDb);
    hardThresholdLinear = dbToLinear(hardThresholdDb);
    if (hardThresholdLinear > softThresholdLinear) {
      hardThresholdLinear = softThresholdLinear * 0.5f;
    }
    softMinGainLinear = dbToLinear(softRangeDb);
    hardMinGainLinear = dbToLinear(hardRangeDb);
    wet = clampf(wetMix, 0.0f, 1.0f);
    hfDuckAmount = clampf(hfDuck, 0.0f, 1.0f);
    enabled = true;
    envelope = 0.0f;
    hfStateL = 0.0f;
    hfStateR = 0.0f;

    const float sr = samplerate > 0 ? static_cast<float>(samplerate) : 48000.0f;
    attackCoef = std::exp(-1.0f / std::max(1.0f, attackSec * sr));
    releaseCoef = std::exp(-1.0f / std::max(1.0f, releaseSec * sr));
    // ~2.5 kHz one-pole lowpass for "body"; closed gate leans on this (HF duck).
    hfLpCoef = std::exp(-2.0f * 3.14159265f * 2500.0f / sr);

    delayLen = static_cast<unsigned int>(std::max(1.0f, lookAheadSec * sr));
    delayL.assign(delayLen, 0.0f);
    delayR.assign(delayLen, 0.0f);
    delayWrite = 0;
    delayFilled = 0;
  }

  float computeGateGain(float env) const {
    if (env >= softThresholdLinear) {
      return 1.0f;
    }

    if (env <= hardThresholdLinear) {
      // Fully in noise/gap territory — deepest cut.
      return hardMinGainLinear;
    }

    // Soft knee between hard and soft thresholds (protect piano tails).
    const float span = softThresholdLinear - hardThresholdLinear;
    const float x = span > 1.0e-8f ? (env - hardThresholdLinear) / span : 1.0f;
    const float curved = x * x * (3.0f - 2.0f * x); // smoothstep
    return hardMinGainLinear + (1.0f - hardMinGainLinear) * curved;
  }

  void processInPlace(float *buffer, unsigned int frames) {
    if (!enabled || frames == 0 || buffer == nullptr) {
      return;
    }

    for (unsigned int i = 0; i < frames; ++i) {
      float *sample = buffer + (i * 2);
      const float inL = sample[0];
      const float inR = sample[1];
      const float peak = std::max(std::fabs(inL), std::fabs(inR));

      if (peak > envelope) {
        envelope = attackCoef * envelope + (1.0f - attackCoef) * peak;
      } else {
        envelope = releaseCoef * envelope + (1.0f - releaseCoef) * peak;
      }

      // Look-ahead: decide gain from current envelope, apply to delayed audio.
      delayL[delayWrite] = inL;
      delayR[delayWrite] = inR;
      delayWrite = (delayWrite + 1) % delayLen;
      if (delayFilled < delayLen) {
        delayFilled++;
        sample[0] = 0.0f;
        sample[1] = 0.0f;
        continue;
      }

      const unsigned int readPos = delayWrite; // oldest sample
      float outL = delayL[readPos];
      float outR = delayR[readPos];

      // Peak in look-ahead window (already reflected in fast attack envelope on input).
      // Also peek max absolute value still in delay for open-before-attack.
      float lookPeak = envelope;
      for (unsigned int d = 0; d < delayLen; d += 4) {
        const unsigned int idx = (readPos + d) % delayLen;
        lookPeak = std::max(lookPeak, std::max(std::fabs(delayL[idx]), std::fabs(delayR[idx])));
      }

      const float gateGain = computeGateGain(lookPeak);
      const float applied = 1.0f + wet * (gateGain - 1.0f);
      outL *= applied;
      outR *= applied;

      // When closed, duck highs (typing / hiss often brighter than piano body).
      const float closed = 1.0f - gateGain;
      if (closed > 0.02f && hfDuckAmount > 0.0f) {
        hfStateL = hfLpCoef * hfStateL + (1.0f - hfLpCoef) * outL;
        hfStateR = hfLpCoef * hfStateR + (1.0f - hfLpCoef) * outR;
        const float duck = closed * hfDuckAmount;
        outL = outL + duck * (hfStateL - outL);
        outR = outR + duck * (hfStateR - outR);
      }

      sample[0] = outL;
      sample[1] = outR;
    }
  }

  /** Flush remaining look-ahead tail into buffer (caller may write silence pad). */
  unsigned int flush(float *buffer, unsigned int maxFrames) {
    if (!enabled || delayFilled == 0 || buffer == nullptr) {
      return 0;
    }

    unsigned int written = 0;
    while (delayFilled > 0 && written < maxFrames) {
      const unsigned int readPos = delayWrite;
      float outL = delayL[readPos];
      float outR = delayR[readPos];
      delayWrite = (delayWrite + 1) % delayLen;
      delayFilled--;

      const float gateGain = computeGateGain(envelope);
      const float applied = 1.0f + wet * (gateGain - 1.0f);
      outL *= applied;
      outR *= applied;

      buffer[written * 2] = outL;
      buffer[written * 2 + 1] = outR;
      written++;
    }
    return written;
  }
};

struct PolishPreset {
  // Voloco-Clean style: HPF + 7 parametric bands + hi-shelf.
  float highpassHz;
  float eqFreqHz[7];
  float eqWidthOct[7];
  float eqGainDb[7];
  float hiShelfHz;
  float hiShelfGainDb;

  // Compressor (optional auto-threshold from file loudness).
  bool useAutoThreshold;
  float autoThresholdDiffDb; // threshold = avgLoudnessDb + diff
  float compInputGainDb;
  float compThresholdDb; // fallback / when auto off
  float compRatio;
  float compAttackSec;
  float compReleaseSec;
  float compWet;
  float compKeyHpHz;

  // Speech-only de-esser (compressor keyed on highs).
  bool useDeEsser;
  float deEssCutoffHz;
  float deEssRatio;
  float deEssThresholdDb;
  float deEssAttackSec;
  float deEssReleaseSec;
  float deEssWet;

  float limiterCeilingDb;
  float limiterThresholdDb;
  float limiterReleaseSec;

  // Legacy gate (kept off for Clean presets).
  bool useNoiseGate;
  float gateSoftThresholdDb;
  float gateHardThresholdDb;
  float gateSoftRangeDb;
  float gateHardRangeDb;
  float gateAttackSec;
  float gateReleaseSec;
  float gateWet;
  float gateHfDuck;
  float gateLookAheadSec;
  float gateNoiseMarginDb;
};

void fillDefaultEqBands(PolishPreset *p) {
  // Approx Voloco Clean EQ centers: 200 Hz … 8 kHz.
  const float freqs[7] = {200.0f, 400.0f, 800.0f, 1600.0f, 3200.0f, 5000.0f, 8000.0f};
  for (int i = 0; i < 7; ++i) {
    p->eqFreqHz[i] = freqs[i];
    p->eqWidthOct[i] = 0.7f;
    p->eqGainDb[i] = 0.0f;
  }
  p->hiShelfHz = 12000.0f;
  p->hiShelfGainDb = 0.0f;
}

PolishPreset resolvePreset(const char *preset) {
  PolishPreset speech = {};
  fillDefaultEqBands(&speech);
  speech.highpassHz = 80.0f;
  speech.eqGainDb[0] = -1.0f;  // 200 Hz mud
  speech.eqGainDb[1] = -0.5f;
  speech.eqGainDb[4] = 1.0f;   // presence
  speech.eqGainDb[5] = 1.5f;
  speech.hiShelfGainDb = 1.5f;
  speech.useAutoThreshold = true;
  speech.autoThresholdDiffDb = -8.0f;
  speech.compInputGainDb = 1.5f;
  speech.compThresholdDb = -18.0f;
  speech.compRatio = 3.0f;
  speech.compAttackSec = 0.008f;
  speech.compReleaseSec = 0.22f;
  speech.compWet = 0.85f;
  speech.compKeyHpHz = 80.0f;
  speech.useDeEsser = true;
  speech.deEssCutoffHz = 5500.0f;
  speech.deEssRatio = 3.0f;
  speech.deEssThresholdDb = -22.0f;
  speech.deEssAttackSec = 0.005f;
  speech.deEssReleaseSec = 0.08f;
  speech.deEssWet = 0.75f;
  speech.limiterCeilingDb = -1.0f;
  speech.limiterThresholdDb = -2.0f;
  speech.limiterReleaseSec = 0.05f;
  speech.useNoiseGate = false;

  // Instrument Clean: near-flat tone, light dynamics (+ make-up into limiter).
  PolishPreset instrument = {};
  fillDefaultEqBands(&instrument);
  instrument.highpassHz = 45.0f;  // rumble only; EQ bands stay flat (0 dB)
  instrument.hiShelfGainDb = 0.0f;
  instrument.useAutoThreshold = true;
  instrument.autoThresholdDiffDb = -10.0f;
  instrument.compInputGainDb = 2.0f;
  instrument.compThresholdDb = -18.0f;
  instrument.compRatio = 1.8f;
  instrument.compAttackSec = 0.020f;
  instrument.compReleaseSec = 0.35f;
  instrument.compWet = 0.55f;
  instrument.compKeyHpHz = 100.0f;
  instrument.useDeEsser = false;
  instrument.limiterCeilingDb = -1.0f;
  instrument.limiterThresholdDb = -2.0f;
  instrument.limiterReleaseSec = 0.06f;
  instrument.useNoiseGate = false;

  PolishPreset mixed = instrument;
  mixed.highpassHz = 65.0f;
  mixed.eqGainDb[4] = 1.2f;
  mixed.eqGainDb[5] = 1.2f;
  mixed.eqGainDb[6] = 0.5f;
  mixed.hiShelfGainDb = 1.0f;
  mixed.compWet = 0.70f;
  mixed.compRatio = 2.0f;
  mixed.useDeEsser = true; // light de-ess when voice present
  mixed.deEssCutoffHz = 6000.0f;
  mixed.deEssRatio = 2.0f;
  mixed.deEssThresholdDb = -24.0f;
  mixed.deEssAttackSec = 0.006f;
  mixed.deEssReleaseSec = 0.10f;
  mixed.deEssWet = 0.55f;

  if (preset == nullptr) {
    return speech;
  }
  if (std::strcmp(preset, "instrument-polish") == 0 ||
      std::strcmp(preset, "instrument-clean") == 0) {
    return instrument;
  }
  if (std::strcmp(preset, "mixed-polish") == 0 ||
      std::strcmp(preset, "mixed-clean") == 0) {
    return mixed;
  }
  // speech-polish / speech-clean / default
  return speech;
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

/**
 * Pass 1: estimate noise floor from quietest ~12% of 20 ms block peaks (after HPF).
 * Returns noise floor in dB, or a very low sentinel if analysis is unusable.
 */
float analyzeNoiseFloorDb(
  const char *inputPath,
  unsigned int samplerateHint,
  float highpassHz
) {
  Superpowered::Decoder *decoder = new Superpowered::Decoder();
  if (decoder->open(inputPath) != Superpowered::Decoder::OpenSuccess) {
    delete decoder;
    return -90.0f;
  }

  const unsigned int samplerate = decoder->getSamplerate() > 0
    ? decoder->getSamplerate()
    : (samplerateHint > 0 ? samplerateHint : 44100);

  Superpowered::Filter *highpass = nullptr;
  if (highpassHz > 1.0f) {
    highpass = new Superpowered::Filter(Superpowered::Filter::Resonant_Highpass, samplerate);
    highpass->frequency = highpassHz;
    highpass->resonance = 0.1f;
    highpass->enabled = true;
  }

  const unsigned int framesPerChunk = decoder->getFramesPerChunk();
  const unsigned int blockSize = std::max(64u, samplerate / 50u); // ~20 ms
  short int *intBuffer = (short int *)std::malloc(framesPerChunk * 2 * sizeof(short int) + 16384);
  float *floatBuffer = (float *)std::malloc(framesPerChunk * 2 * sizeof(float) + 16384);
  if (intBuffer == nullptr || floatBuffer == nullptr) {
    std::free(intBuffer);
    std::free(floatBuffer);
    delete highpass;
    delete decoder;
    return -90.0f;
  }

  std::vector<float> blockPeaks;
  blockPeaks.reserve(4096);
  float blockPeak = 0.0f;
  unsigned int inBlock = 0;

  while (true) {
    int framesDecoded = decoder->decodeAudio(intBuffer, framesPerChunk);
    if (framesDecoded < 1) {
      break;
    }

    const unsigned int frames = (unsigned int)framesDecoded;
    Superpowered::ShortIntToFloat(intBuffer, floatBuffer, frames);
    if (highpass != nullptr) {
      highpass->samplerate = samplerate;
      highpass->process(floatBuffer, floatBuffer, frames);
    }

    for (unsigned int i = 0; i < frames; ++i) {
      const float peak = std::max(
        std::fabs(floatBuffer[i * 2]),
        std::fabs(floatBuffer[i * 2 + 1])
      );
      blockPeak = std::max(blockPeak, peak);
      inBlock++;
      if (inBlock >= blockSize) {
        blockPeaks.push_back(blockPeak);
        blockPeak = 0.0f;
        inBlock = 0;
      }
    }
  }

  if (inBlock > 0) {
    blockPeaks.push_back(blockPeak);
  }

  std::free(intBuffer);
  std::free(floatBuffer);
  delete highpass;
  delete decoder;

  if (blockPeaks.size() < 4) {
    return -90.0f;
  }

  std::sort(blockPeaks.begin(), blockPeaks.end());
  // 12th percentile ≈ quiet gaps / noise floor (not absolute silence zeros only).
  const size_t index = std::min(
    blockPeaks.size() - 1,
    static_cast<size_t>(blockPeaks.size() * 0.12)
  );
  const float floorLinear = std::max(blockPeaks[index], 1.0e-6f);
  return linearToDb(floorLinear);
}

/** Pass-1 average loudness (dB) for Voloco-style auto-threshold compressor. */
float analyzeAverageLoudnessDb(const char *inputPath) {
  Superpowered::Decoder *decoder = new Superpowered::Decoder();
  if (decoder->open(inputPath) != Superpowered::Decoder::OpenSuccess) {
    delete decoder;
    return -20.0f;
  }

  const unsigned int framesPerChunk = decoder->getFramesPerChunk();
  short int *intBuffer = (short int *)std::malloc(framesPerChunk * 2 * sizeof(short int) + 16384);
  float *floatBuffer = (float *)std::malloc(framesPerChunk * 2 * sizeof(float) + 16384);
  if (intBuffer == nullptr || floatBuffer == nullptr) {
    std::free(intBuffer);
    std::free(floatBuffer);
    delete decoder;
    return -20.0f;
  }

  double sumSq = 0.0;
  size_t sampleCount = 0;
  while (true) {
    const int framesDecoded = decoder->decodeAudio(intBuffer, framesPerChunk);
    if (framesDecoded < 1) {
      break;
    }
    const unsigned int frames = (unsigned int)framesDecoded;
    Superpowered::ShortIntToFloat(intBuffer, floatBuffer, frames);
    for (unsigned int i = 0; i < frames * 2; ++i) {
      const float s = floatBuffer[i];
      sumSq += (double)s * (double)s;
      ++sampleCount;
    }
  }

  std::free(intBuffer);
  std::free(floatBuffer);
  delete decoder;

  if (sampleCount == 0) {
    return -20.0f;
  }
  return linearToDb((float)std::sqrt(sumSq / (double)sampleCount));
}

} // namespace

extern "C" int SuperpoweredPolish_initialize(const char *licenseKey) {
  if (licenseKey == nullptr || licenseKey[0] == '\0') {
    setError("License key is empty.");
    return 0;
  }

  if (gInitialized) {
    return 1;
  }

  Superpowered::Initialize(licenseKey);
  gInitialized = true;
  setError(nullptr);
  return 1;
}

extern "C" int SuperpoweredPolish_isInitialized(void) {
  return gInitialized ? 1 : 0;
}

extern "C" const char *SuperpoweredPolish_lastError(void) {
  return gLastError;
}

extern "C" int SuperpoweredPolish_processFile(
  const char *inputPath,
  const char *outputWavPath,
  const char *preset
) {
  if (!gInitialized) {
    setError("Superpowered is not initialized. Call SuperpoweredPolish_initialize first.");
    return 1;
  }

  const std::string input = stripFileUri(inputPath);
  const std::string output = stripFileUri(outputWavPath);

  if (input.empty() || output.empty()) {
    setError("Input or output path is empty.");
    return 2;
  }

  const PolishPreset params = resolvePreset(preset);

  float softThresholdDb = params.gateSoftThresholdDb;
  float hardThresholdDb = params.gateHardThresholdDb;
  if (params.useNoiseGate) {
    const float noiseFloorDb = analyzeNoiseFloorDb(input.c_str(), 44100, params.highpassHz);
    if (noiseFloorDb > -85.0f && noiseFloorDb < -10.0f) {
      softThresholdDb = clampf(noiseFloorDb + params.gateNoiseMarginDb, -60.0f, -18.0f);
      hardThresholdDb = clampf(noiseFloorDb + 2.0f, -70.0f, softThresholdDb - 4.0f);
    }
  }

  float compThresholdDb = params.compThresholdDb;
  if (params.useAutoThreshold) {
    const float avgDb = analyzeAverageLoudnessDb(input.c_str());
    compThresholdDb = clampf(avgDb + params.autoThresholdDiffDb, -40.0f, -6.0f);
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
    return 3;
  }

  const unsigned int samplerate = decoder->getSamplerate();
  FILE *destinationFile = Superpowered::createWAV(output.c_str(), samplerate, 2);
  if (!destinationFile) {
    setError("Could not create output WAV file.");
    delete decoder;
    return 4;
  }

  Superpowered::Filter *highpass = nullptr;
  if (params.highpassHz > 1.0f) {
    highpass = new Superpowered::Filter(Superpowered::Filter::Resonant_Highpass, samplerate);
    highpass->frequency = params.highpassHz;
    highpass->resonance = 0.1f;
    highpass->enabled = true;
  }

  InstrumentCleaner cleaner;
  if (params.useNoiseGate) {
    cleaner.configure(
      samplerate,
      softThresholdDb,
      hardThresholdDb,
      params.gateSoftRangeDb,
      params.gateHardRangeDb,
      params.gateAttackSec,
      params.gateReleaseSec,
      params.gateWet,
      params.gateHfDuck,
      params.gateLookAheadSec
    );
  }

  Superpowered::Filter *eqBands[7] = {nullptr};
  for (int i = 0; i < 7; ++i) {
    eqBands[i] = new Superpowered::Filter(Superpowered::Filter::Parametric, samplerate);
    eqBands[i]->frequency = params.eqFreqHz[i];
    eqBands[i]->octave = params.eqWidthOct[i];
    eqBands[i]->decibel = params.eqGainDb[i];
    eqBands[i]->enabled = std::fabs(params.eqGainDb[i]) > 0.05f;
  }

  Superpowered::Filter *hiShelf = new Superpowered::Filter(Superpowered::Filter::HighShelf, samplerate);
  hiShelf->frequency = params.hiShelfHz;
  hiShelf->slope = 0.5f;
  hiShelf->decibel = params.hiShelfGainDb;
  hiShelf->enabled = std::fabs(params.hiShelfGainDb) > 0.05f;

  Superpowered::Compressor *deEsser = nullptr;
  if (params.useDeEsser) {
    deEsser = new Superpowered::Compressor(samplerate);
    deEsser->inputGainDb = 0.0f;
    deEsser->outputGainDb = 0.0f;
    deEsser->wet = params.deEssWet;
    deEsser->attackSec = params.deEssAttackSec;
    deEsser->releaseSec = params.deEssReleaseSec;
    deEsser->ratio = params.deEssRatio;
    deEsser->thresholdDb = params.deEssThresholdDb;
    deEsser->hpCutOffHz = params.deEssCutoffHz;
    deEsser->enabled = true;
  }

  Superpowered::Compressor *compressor = new Superpowered::Compressor(samplerate);
  compressor->inputGainDb = params.compInputGainDb;
  compressor->outputGainDb = 0.0f;
  compressor->wet = params.compWet;
  compressor->attackSec = params.compAttackSec;
  compressor->releaseSec = params.compReleaseSec;
  compressor->ratio = params.compRatio;
  compressor->thresholdDb = compThresholdDb;
  compressor->hpCutOffHz = params.compKeyHpHz;
  compressor->enabled = true;

  Superpowered::Limiter *limiter = new Superpowered::Limiter(samplerate);
  limiter->ceilingDb = params.limiterCeilingDb;
  limiter->thresholdDb = params.limiterThresholdDb;
  limiter->releaseSec = params.limiterReleaseSec;
  limiter->enabled = true;

  const unsigned int framesPerChunk = decoder->getFramesPerChunk();
  short int *intBuffer = (short int *)std::malloc(framesPerChunk * 2 * sizeof(short int) + 16384);
  float *floatBuffer = (float *)std::malloc(framesPerChunk * 2 * sizeof(float) + 16384);

  if (intBuffer == nullptr || floatBuffer == nullptr) {
    setError("Out of memory allocating audio buffers.");
    std::free(intBuffer);
    std::free(floatBuffer);
    delete limiter;
    delete compressor;
    delete deEsser;
    delete hiShelf;
    for (int i = 0; i < 7; ++i) {
      delete eqBands[i];
    }
    delete highpass;
    Superpowered::closeWAV(destinationFile);
    delete decoder;
    return 5;
  }

  auto runPolishChain = [&](float *buffer, unsigned int frames) {
    for (int i = 0; i < 7; ++i) {
      if (eqBands[i] != nullptr && eqBands[i]->enabled) {
        eqBands[i]->samplerate = samplerate;
        eqBands[i]->process(buffer, buffer, frames);
      }
    }
    if (hiShelf->enabled) {
      hiShelf->samplerate = samplerate;
      hiShelf->process(buffer, buffer, frames);
    }
    if (deEsser != nullptr) {
      deEsser->samplerate = samplerate;
      deEsser->process(buffer, buffer, frames);
    }
    compressor->samplerate = samplerate;
    limiter->samplerate = samplerate;
    compressor->process(buffer, buffer, frames);
    limiter->process(buffer, buffer, frames);
  };

  while (true) {
    int framesDecoded = decoder->decodeAudio(intBuffer, framesPerChunk);
    if (framesDecoded < 1) {
      break;
    }

    const unsigned int frames = (unsigned int)framesDecoded;
    Superpowered::ShortIntToFloat(intBuffer, floatBuffer, frames);

    if (highpass != nullptr) {
      highpass->samplerate = samplerate;
      highpass->process(floatBuffer, floatBuffer, frames);
    }

    if (params.useNoiseGate) {
      cleaner.processInPlace(floatBuffer, frames);
    }

    runPolishChain(floatBuffer, frames);

    Superpowered::FloatToShortInt(floatBuffer, intBuffer, frames);
    Superpowered::writeWAV(destinationFile, intBuffer, frames * 4);
  }

  if (params.useNoiseGate) {
    const unsigned int flushCap = framesPerChunk + cleaner.delayLen + 64;
    float *flushBuffer = (float *)std::malloc(flushCap * 2 * sizeof(float));
    short int *flushInt = (short int *)std::malloc(flushCap * 2 * sizeof(short int));
    if (flushBuffer != nullptr && flushInt != nullptr) {
      const unsigned int flushed = cleaner.flush(flushBuffer, flushCap);
      if (flushed > 0) {
        runPolishChain(flushBuffer, flushed);
        Superpowered::FloatToShortInt(flushBuffer, flushInt, flushed);
        Superpowered::writeWAV(destinationFile, flushInt, flushed * 4);
      }
    }
    std::free(flushBuffer);
    std::free(flushInt);
  }

  Superpowered::closeWAV(destinationFile);
  std::free(intBuffer);
  std::free(floatBuffer);
  delete limiter;
  delete compressor;
  delete deEsser;
  delete hiShelf;
  for (int i = 0; i < 7; ++i) {
    delete eqBands[i];
  }
  delete highpass;
  delete decoder;

  setError(nullptr);
  return 0;
}
