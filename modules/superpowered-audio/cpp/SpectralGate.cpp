#include "SpectralGate.h"

#include <algorithm>
#include <cmath>
#include <cstring>
#include <vector>

#include "SuperpoweredFFT.h"

namespace {

constexpr int kFftLogSize = 11; // 2048
constexpr int kFftSize = 1 << kFftLogSize;
constexpr int kHopSize = 512;
constexpr int kNumBins = kFftSize / 2 + 1;
constexpr float kMaskTimeSmooth = 0.55f;
constexpr float kNoiseTrackFast = 0.90f; // fast-follow decay for noise drops
constexpr float kFluxAvgAlpha = 0.05f;   // running average smoothing for flux baseline
constexpr float kMinFluxEnergy = 1.0e-6f; // minimum frame energy to attempt transient detection

inline float clampf(float v, float lo, float hi) {
  return v < lo ? lo : (v > hi ? hi : v);
}

float peakAbs(const float *samples, size_t frameCount) {
  float peak = 0.0f;
  for (size_t i = 0; i < frameCount; ++i) {
    const float a = std::fabs(samples[i]);
    if (a > peak) {
      peak = a;
    }
  }
  return peak;
}

void buildHannWindow(float *window, int size) {
  for (int i = 0; i < size; ++i) {
    window[i] = 0.5f * (1.0f - std::cos(2.0f * 3.14159265f * (float)i / (float)(size - 1)));
  }
}

void forwardFrame(
  const float *input,
  size_t inputFrames,
  size_t frameStart,
  const float *window,
  float *real,
  float *imag,
  float *magOut
) {
  for (int i = 0; i < kFftSize; ++i) {
    const size_t idx = frameStart + (size_t)i;
    const float sample = idx < inputFrames ? input[idx] : 0.0f;
    real[i] = sample * window[i];
    imag[i] = 0.0f;
  }

  Superpowered::FFTComplex(real, imag, kFftLogSize, true);

  magOut[0] = std::fabs(real[0]);
  for (int b = 1; b < kNumBins - 1; ++b) {
    magOut[b] = std::sqrt(real[b] * real[b] + imag[b] * imag[b]);
  }
  magOut[kNumBins - 1] = std::fabs(real[kFftSize / 2]);
}

void smoothMaskFrequency(float *mask) {
  float prev = mask[0];
  for (int b = 1; b < kNumBins - 1; ++b) {
    const float cur = mask[b];
    const float next = mask[b + 1];
    mask[b] = (prev + cur + next) / 3.0f;
    prev = cur;
  }
}

float peakNormalizeInPlace(
  float *samples,
  size_t frameCount,
  float peakTarget,
  float maxMakeupGain,
  float *peakBeforeOut,
  float *peakAfterOut
) {
  const float peakBefore = peakAbs(samples, frameCount);
  if (peakBeforeOut) {
    *peakBeforeOut = peakBefore;
  }

  if (peakBefore < 1.0e-8f) {
    if (peakAfterOut) {
      *peakAfterOut = peakBefore;
    }
    return 1.0f;
  }

  float gain = peakTarget / peakBefore;
  gain = std::min(gain, maxMakeupGain);
  for (size_t i = 0; i < frameCount; ++i) {
    samples[i] *= gain;
  }

  const float peakAfter = peakAbs(samples, frameCount);
  if (peakAfterOut) {
    *peakAfterOut = peakAfter;
  }
  return gain;
}

} // namespace

SpectralGateParams SpectralGate_instrumentDefaults(void) {
  // Adaptive noise tracking with aggressive hiss attenuation for AC/fan/room noise.
  SpectralGateParams p;
  p.propDecrease = 0.78f;
  p.scaleFactor = 1.65f;
  p.noiseWindowSec = 0.0f;
  p.peakTarget = 0.89125094f; // -1 dBFS
  p.maxMakeupGain = 4.0f;
  p.hissStartHz = 3000.0f;
  p.hissFullHz = 9000.0f;
  p.hissPropDecrease = 0.93f;
  p.hissScaleFactor = 0.60f;
  p.riseAlpha = 0.002f;
  p.transientThreshold = 2.5f;
  return p;
}

bool SpectralGate_processMonoInPlace(
  float *samples,
  size_t frameCount,
  unsigned int samplerate,
  const SpectralGateParams *params,
  SpectralGateStats *statsOut
) {
  if (samples == nullptr || frameCount == 0 || samplerate == 0) {
    return false;
  }

  const SpectralGateParams defaults = SpectralGate_instrumentDefaults();
  const SpectralGateParams cfg = params != nullptr ? *params : defaults;
  const float propDecrease = clampf(cfg.propDecrease, 0.0f, 1.0f);
  const float scaleFactor = std::max(1.01f, cfg.scaleFactor);
  const float peakTarget = clampf(cfg.peakTarget, 0.1f, 0.99f);
  const float maxMakeupGain = std::max(1.0f, cfg.maxMakeupGain);
  const float riseAlpha = clampf(cfg.riseAlpha, 0.0001f, 0.1f);
  const float transientThreshold = std::max(0.0f, cfg.transientThreshold);
  const float hissStartHz = std::max(1000.0f, cfg.hissStartHz);
  const float hissFullHz = std::max(hissStartHz + 100.0f, cfg.hissFullHz);
  const float hissPropDecrease = clampf(cfg.hissPropDecrease, propDecrease, 1.0f);
  const float hissScaleFactor = clampf(cfg.hissScaleFactor, 0.25f, 1.0f);
  const float hzPerBin = (float)samplerate / (float)kFftSize;

  std::vector<float> window(kFftSize);
  buildHannWindow(window.data(), kFftSize);

  // Precompute per-bin hiss adjustments (frequency-dependent, not time-dependent).
  std::vector<float> bandProp(kNumBins, propDecrease);
  std::vector<float> bandNoiseGain(kNumBins, 1.0f - propDecrease);
  std::vector<float> bandScale(kNumBins, scaleFactor);

  for (int b = 0; b < kNumBins; ++b) {
    const float freqHz = (float)b * hzPerBin;
    float hissT = 0.0f;
    if (freqHz >= hissStartHz) {
      hissT = clampf((freqHz - hissStartHz) / (hissFullHz - hissStartHz), 0.0f, 1.0f);
    }

    const float p = propDecrease + hissT * (hissPropDecrease - propDecrease);
    bandProp[b] = p;
    bandNoiseGain[b] = 1.0f - p;

    bandScale[b] = scaleFactor * (1.0f - hissT * (1.0f - hissScaleFactor));
  }

  // Processing buffers.
  std::vector<float> output(frameCount + (size_t)kFftSize, 0.0f);
  std::vector<float> norm(frameCount + (size_t)kFftSize, 0.0f);
  std::vector<float> real(kFftSize, 0.0f);
  std::vector<float> imag(kFftSize, 0.0f);
  std::vector<float> mag(kNumBins, 0.0f);
  std::vector<float> mask(kNumBins, 1.0f);
  std::vector<float> prevMask(kNumBins, 1.0f);

  // Adaptive noise floor estimate.
  std::vector<float> noiseEstimate(kNumBins, 0.0f);
  bool noiseSeeded = false;

  // Transient detection state.
  std::vector<float> prevMag(kNumBins, 0.0f);
  float fluxAvg = 0.0f;
  bool havePrevFrame = false;
  unsigned int transientCount = 0;

  const float invFft = 1.0f / (float)kFftSize;
  size_t totalFramesProcessed = 0;

  for (size_t pos = 0; pos < frameCount; pos += (size_t)kHopSize) {
    forwardFrame(samples, frameCount, pos, window.data(), real.data(), imag.data(), mag.data());

    // --- Spectral flux & transient detection ---
    bool isTransient = false;
    if (havePrevFrame && transientThreshold > 0.0f) {
      float fluxNum = 0.0f;
      float fluxDen = 0.0f;
      for (int b = 0; b < kNumBins; ++b) {
        const float diff = std::fabs(mag[b] - prevMag[b]);
        fluxNum += diff;
        fluxDen += mag[b];
      }

      if (fluxDen > kMinFluxEnergy) {
        const float relativeFlux = fluxNum / fluxDen;
        fluxAvg = kFluxAvgAlpha * relativeFlux + (1.0f - kFluxAvgAlpha) * fluxAvg;
        if (relativeFlux > fluxAvg * transientThreshold) {
          isTransient = true;
        }
      }
    }

    // --- Adaptive noise tracking (frozen during transients) ---
    if (!noiseSeeded) {
      for (int b = 0; b < kNumBins; ++b) {
        noiseEstimate[b] = mag[b];
      }
      noiseSeeded = true;
    } else if (!isTransient) {
      for (int b = 0; b < kNumBins; ++b) {
        if (mag[b] < noiseEstimate[b]) {
          noiseEstimate[b] = kNoiseTrackFast * noiseEstimate[b] +
                             (1.0f - kNoiseTrackFast) * mag[b];
        } else {
          noiseEstimate[b] += riseAlpha * (mag[b] - noiseEstimate[b]);
        }
      }
    }

    // --- Build mask (fully open during transients) ---
    if (isTransient) {
      for (int b = 0; b < kNumBins; ++b) {
        mask[b] = 1.0f;
      }
      prevMask = mask;
      transientCount++;
    } else {
      for (int b = 0; b < kNumBins; ++b) {
        const float t = noiseEstimate[b] * bandScale[b] + 1.0e-12f;
        const float soft = 1.0f / (1.0f + std::exp(-4.0f * ((mag[b] - t) / t)));
        float m = bandNoiseGain[b] + bandProp[b] * soft;
        m = prevMask[b] * kMaskTimeSmooth + m * (1.0f - kMaskTimeSmooth);
        mask[b] = clampf(m, bandNoiseGain[b], 1.0f);
      }
      smoothMaskFrequency(mask.data());
      prevMask = mask;
    }

    // --- Apply mask in frequency domain ---
    real[0] *= mask[0];
    imag[0] *= mask[0];
    for (int b = 1; b < kNumBins - 1; ++b) {
      real[b] *= mask[b];
      imag[b] *= mask[b];
      real[kFftSize - b] *= mask[b];
      imag[kFftSize - b] *= mask[b];
    }
    real[kFftSize / 2] *= mask[kNumBins - 1];
    imag[kFftSize / 2] *= mask[kNumBins - 1];

    // --- ISTFT ---
    Superpowered::FFTComplex(real.data(), imag.data(), kFftLogSize, false);

    for (int i = 0; i < kFftSize; ++i) {
      const size_t outIdx = pos + (size_t)i;
      if (outIdx >= output.size()) {
        break;
      }
      const float w = window[i];
      output[outIdx] += real[i] * invFft * w;
      norm[outIdx] += w * w;
    }

    // Save current frame for next iteration's flux computation.
    if (!havePrevFrame) {
      std::copy(mag.begin(), mag.end(), prevMag.begin());
      havePrevFrame = true;
    } else {
      for (int b = 0; b < kNumBins; ++b) {
        prevMag[b] = mag[b];
      }
    }

    totalFramesProcessed++;
  }

  // --- Overlap-add normalize ---
  for (size_t i = 0; i < frameCount; ++i) {
    const float n = norm[i];
    samples[i] = n > 1.0e-8f ? output[i] / n : 0.0f;
  }

  // --- Peak normalize ---
  float peakBefore = 0.0f;
  float peakAfter = 0.0f;
  const float peakGain = peakNormalizeInPlace(
    samples,
    frameCount,
    peakTarget,
    maxMakeupGain,
    &peakBefore,
    &peakAfter
  );

  if (statsOut != nullptr) {
    statsOut->propDecrease = propDecrease;
    statsOut->peakTarget = peakTarget;
    statsOut->peakGainApplied = peakGain;
    statsOut->peakBefore = peakBefore;
    statsOut->peakAfter = peakAfter;
    statsOut->riseAlpha = riseAlpha;
    statsOut->transientThreshold = transientThreshold;
    statsOut->noiseProfileFrames = (unsigned int)totalFramesProcessed;
    statsOut->transientCount = transientCount;
  }

  return true;
}
