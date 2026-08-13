#include "PitchYin.h"

#include <algorithm>
#include <cmath>
#include <cstring>

namespace {

float median3(float a, float b, float c) {
  if (a > b) {
    std::swap(a, b);
  }
  if (b > c) {
    std::swap(b, c);
  }
  if (a > b) {
    std::swap(a, b);
  }
  return b;
}

} // namespace

void PitchYinAnalyzer::reset(unsigned int samplerate) {
  samplerate_ = samplerate < 8000 ? 48000 : samplerate;
  windowSize_ = 2048;
  hopSize_ = 1024;
  filled_ = 0;
  window_.assign(static_cast<size_t>(windowSize_), 0.0f);
  hops_.clear();
}

void PitchYinAnalyzer::addStereo(const float *interleaved, unsigned int frames) {
  if (interleaved == nullptr || frames == 0) {
    return;
  }
  if (window_.empty()) {
    reset(samplerate_);
  }

  for (unsigned int i = 0; i < frames; ++i) {
    const float mono = 0.5f * (interleaved[i * 2] + interleaved[i * 2 + 1]);
    if (filled_ < windowSize_) {
      window_[static_cast<size_t>(filled_++)] = mono;
    } else {
      std::memmove(
        window_.data(),
        window_.data() + hopSize_,
        static_cast<size_t>(windowSize_ - hopSize_) * sizeof(float));
      filled_ = windowSize_ - hopSize_;
      window_[static_cast<size_t>(filled_++)] = mono;
    }
    if (filled_ == windowSize_) {
      hops_.push_back(analyzeWindow(window_.data()));
      std::memmove(
        window_.data(),
        window_.data() + hopSize_,
        static_cast<size_t>(windowSize_ - hopSize_) * sizeof(float));
      filled_ = windowSize_ - hopSize_;
    }
  }
}

void PitchYinAnalyzer::finish() {
  if (filled_ >= hopSize_ * 2) {
    // Pad remaining window with zeros and emit one last hop if enough energy.
    while (filled_ < windowSize_) {
      window_[static_cast<size_t>(filled_++)] = 0.0f;
    }
    hops_.push_back(analyzeWindow(window_.data()));
  }
  filled_ = 0;
}

PitchHop PitchYinAnalyzer::analyzeWindow(const float *mono) const {
  PitchHop hop;
  if (mono == nullptr) {
    return hop;
  }

  float energy = 0.0f;
  for (int i = 0; i < windowSize_; ++i) {
    energy += mono[i] * mono[i];
  }
  energy /= static_cast<float>(windowSize_);
  if (energy < 1.0e-8f) {
    return hop;
  }

  const int minTau = std::max(2, static_cast<int>(samplerate_ / 1000)); // ~1000 Hz
  const int maxTau = std::min(windowSize_ / 2, static_cast<int>(samplerate_ / 60)); // ~60 Hz
  if (maxTau <= minTau + 2) {
    return hop;
  }

  std::vector<float> d(static_cast<size_t>(maxTau + 1), 0.0f);
  for (int tau = 1; tau <= maxTau; ++tau) {
    float sum = 0.0f;
    for (int i = 0; i < windowSize_ - tau; ++i) {
      const float diff = mono[i] - mono[i + tau];
      sum += diff * diff;
    }
    d[static_cast<size_t>(tau)] = sum;
  }

  std::vector<float> cmnd(static_cast<size_t>(maxTau + 1), 1.0f);
  float running = 0.0f;
  cmnd[0] = 1.0f;
  for (int tau = 1; tau <= maxTau; ++tau) {
    running += d[static_cast<size_t>(tau)];
    cmnd[static_cast<size_t>(tau)] =
      running > 0.0f ? d[static_cast<size_t>(tau)] * static_cast<float>(tau) / running : 1.0f;
  }

  const float threshold = 0.15f;
  int bestTau = -1;
  for (int tau = minTau; tau < maxTau; ++tau) {
    if (cmnd[static_cast<size_t>(tau)] < threshold) {
      while (tau + 1 <= maxTau &&
             cmnd[static_cast<size_t>(tau + 1)] < cmnd[static_cast<size_t>(tau)]) {
        ++tau;
      }
      bestTau = tau;
      break;
    }
  }
  if (bestTau < 0) {
    float bestVal = 1.0f;
    for (int tau = minTau; tau <= maxTau; ++tau) {
      if (cmnd[static_cast<size_t>(tau)] < bestVal) {
        bestVal = cmnd[static_cast<size_t>(tau)];
        bestTau = tau;
      }
    }
    if (bestVal > 0.35f) {
      return hop;
    }
  }

  // Parabolic interpolation around bestTau.
  float tauF = static_cast<float>(bestTau);
  if (bestTau > 1 && bestTau < maxTau) {
    const float s0 = cmnd[static_cast<size_t>(bestTau - 1)];
    const float s1 = cmnd[static_cast<size_t>(bestTau)];
    const float s2 = cmnd[static_cast<size_t>(bestTau + 1)];
    const float denom = 2.0f * (2.0f * s1 - s2 - s0);
    if (std::fabs(denom) > 1.0e-8f) {
      tauF += (s0 - s2) / denom;
    }
  }

  hop.hz = static_cast<float>(samplerate_) / std::max(tauF, 1.0f);
  hop.confidence = 1.0f - cmnd[static_cast<size_t>(bestTau)];
  if (hop.confidence < 0.0f) {
    hop.confidence = 0.0f;
  }
  if (hop.confidence > 1.0f) {
    hop.confidence = 1.0f;
  }
  return hop;
}

void PitchYinAnalyzer::repairCurve() {
  if (hops_.empty()) {
    return;
  }

  // Median of three for voiced hops.
  std::vector<PitchHop> smoothed = hops_;
  for (size_t i = 1; i + 1 < hops_.size(); ++i) {
    if (hops_[i].hz <= 0.0f || hops_[i].confidence < 0.25f) {
      continue;
    }
    const float a = hops_[i - 1].hz > 0.0f ? hops_[i - 1].hz : hops_[i].hz;
    const float b = hops_[i].hz;
    const float c = hops_[i + 1].hz > 0.0f ? hops_[i + 1].hz : hops_[i].hz;
    smoothed[i].hz = median3(a, b, c);
  }
  hops_.swap(smoothed);

  // Octave repair relative to previous stable pitch.
  float lastGood = 0.0f;
  for (PitchHop &hop : hops_) {
    if (hop.hz <= 0.0f || hop.confidence < 0.25f) {
      continue;
    }
    if (lastGood > 0.0f) {
      while (hop.hz > lastGood * 1.9f) {
        hop.hz *= 0.5f;
      }
      while (hop.hz < lastGood * 0.55f) {
        hop.hz *= 2.0f;
      }
    }
    lastGood = hop.hz;
  }

  // Hold last good pitch across short unvoiced gaps (<= 4 hops).
  lastGood = 0.0f;
  int gap = 0;
  for (PitchHop &hop : hops_) {
    if (hop.hz > 0.0f && hop.confidence >= 0.25f) {
      lastGood = hop.hz;
      gap = 0;
      continue;
    }
    ++gap;
    if (lastGood > 0.0f && gap <= 4) {
      hop.hz = lastGood;
      hop.confidence = 0.3f;
    } else if (gap > 4) {
      hop.hz = 0.0f;
      hop.confidence = 0.0f;
    }
  }
}
