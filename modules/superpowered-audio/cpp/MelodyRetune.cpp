#include "MelodyRetune.h"

#include "signalsmith-stretch.h"

#include <algorithm>
#include <cmath>
#include <cstring>

namespace {

float clampf(float value, float lo, float hi) {
  if (value < lo) {
    return lo;
  }
  if (value > hi) {
    return hi;
  }
  return value;
}

float hzToMidi(float hz) {
  return 69.0f + 12.0f * std::log2(std::max(hz, 1.0f) / 440.0f);
}

float midiToHz(float midi) {
  return 440.0f * std::pow(2.0f, (midi - 69.0f) / 12.0f);
}

/** Single-channel view for Signalsmith mono processing. */
struct MonoChannel {
  float *ptr = nullptr;
  float *operator[](int) { return ptr; }
};

struct MonoChannelConst {
  const float *ptr = nullptr;
  const float *operator[](int) const { return ptr; }
};

} // namespace

float MelodyRetuneEngine::targetHz(float hz) {
  if (hz <= 0.0f) {
    return 0.0f;
  }
  return midiToHz(std::round(hzToMidi(hz)));
}

void MelodyRetuneEngine::reset(unsigned int sr, const MelodyRetuneParams &next) {
  destroy();
  active = true;
  samplerate = sr < 8000 ? 48000 : sr;
  params = next;
  params.strength = clampf(params.strength, 0.0f, 1.0f);
  params.slewMs = clampf(params.slewMs, 1.0f, 200.0f);
  params.vibratoCents = clampf(params.vibratoCents, 0.0f, 80.0f);
  params.wet = clampf(params.wet, 0.0f, 1.0f);
  yin.reset(samplerate);
  original.clear();
  rendered.clear();
  readPos = 0;
}

void MelodyRetuneEngine::destroy() {
  original.clear();
  rendered.clear();
  yin.reset(samplerate);
  readPos = 0;
  active = false;
}

void MelodyRetuneEngine::addAnalysis(const float *stereo, unsigned int frames) {
  if (!active || stereo == nullptr || frames == 0) {
    return;
  }
  original.insert(original.end(), stereo, stereo + static_cast<size_t>(frames) * 2u);
  yin.addStereo(stereo, frames);
}

void MelodyRetuneEngine::finishAnalysis() {
  if (!active) {
    return;
  }
  yin.finish();
  yin.repairCurve();
  render();
  // Free source stereo after wet is built — write pass only needs rendered.
  original.clear();
  original.shrink_to_fit();
}

void MelodyRetuneEngine::resetApply() {
  readPos = 0;
}

void MelodyRetuneEngine::measureRendered(
  float *peakOut,
  double *sumSquaresOut,
  uint64_t *sampleCountOut
) const {
  float peak = 0.0f;
  double sumSquares = 0.0;
  const uint64_t sampleCount = rendered.size();
  for (float s : rendered) {
    const float a = std::fabs(s);
    if (a > peak) {
      peak = a;
    }
    sumSquares += static_cast<double>(s) * static_cast<double>(s);
  }
  if (peakOut != nullptr) {
    *peakOut = peak;
  }
  if (sumSquaresOut != nullptr) {
    *sumSquaresOut = sumSquares;
  }
  if (sampleCountOut != nullptr) {
    *sampleCountOut = sampleCount;
  }
}

void MelodyRetuneEngine::process(float *buffer, unsigned int frames) {
  if (!active || buffer == nullptr || frames == 0) {
    return;
  }
  const uint64_t totalFrames = rendered.size() / 2u;
  for (unsigned int i = 0; i < frames; ++i) {
    if (readPos < totalFrames) {
      buffer[i * 2] = rendered[static_cast<size_t>(readPos) * 2u];
      buffer[i * 2 + 1] = rendered[static_cast<size_t>(readPos) * 2u + 1u];
      ++readPos;
    }
  }
}

void MelodyRetuneEngine::render() {
  rendered.clear();
  const unsigned int totalFrames = static_cast<unsigned int>(original.size() / 2u);
  if (totalFrames < 64 || original.empty()) {
    rendered = original;
    return;
  }

  const auto &hops = yin.hops();
  const unsigned int hopSize = std::max(1u, yin.hopSize());
  const float hopMs = 1000.0f * static_cast<float>(hopSize) / static_cast<float>(samplerate);
  const float slewAlpha =
    params.slewMs <= hopMs ? 1.0f : 1.0f - std::exp(-hopMs / params.slewMs);

  float appliedCents = 0.0f;
  std::vector<float> centsPerHop(hops.size(), 0.0f);
  for (size_t i = 0; i < hops.size(); ++i) {
    const PitchHop &hop = hops[i];
    float targetCents = 0.0f;
    if (hop.hz > 0.0f && hop.confidence >= 0.35f) {
      const float target = targetHz(hop.hz);
      if (target > 0.0f) {
        const float errorCents = 1200.0f * std::log2(target / hop.hz);
        if (std::fabs(errorCents) >= params.vibratoCents) {
          targetCents = errorCents * params.strength;
        }
      }
    }
    appliedCents += (targetCents - appliedCents) * slewAlpha;
    appliedCents = clampf(appliedCents, -1200.0f, 1200.0f);
    centsPerHop[i] = appliedCents;
  }

  // Mono dry for stretch (vocals are effectively mono). Keeps L/R for final mix.
  std::vector<float> dryMono(totalFrames);
  for (unsigned int i = 0; i < totalFrames; ++i) {
    dryMono[i] =
      0.5f * (original[static_cast<size_t>(i) * 2u] + original[static_cast<size_t>(i) * 2u + 1u]);
  }

  // Half-rate stretch (~2× less STFT work) + small block/interval (much cheaper than
  // presetCheaper's ~0.1s blocks at 48 kHz).
  const unsigned int workFrames = (totalFrames + 1u) / 2u;
  std::vector<float> dryWork(workFrames);
  for (unsigned int i = 0; i < workFrames; ++i) {
    const unsigned int a = std::min(i * 2u, totalFrames - 1u);
    const unsigned int b = std::min(a + 1u, totalFrames - 1u);
    dryWork[i] = 0.5f * (dryMono[a] + dryMono[b]);
  }

  signalsmith::stretch::SignalsmithStretch<float> stretch;
  const int blockSamples = 1024;
  const int intervalSamples = 256;
  stretch.configure(1, blockSamples, intervalSamples, false);
  stretch.reset();

  const int inLatency = stretch.inputLatency();
  const int outLatency = stretch.outputLatency();
  const int seekLen = stretch.seekLength();

  std::vector<float> seekBuf(static_cast<size_t>(seekLen), 0.0f);
  const int copySeek = std::min(seekLen, static_cast<int>(workFrames));
  if (copySeek > 0) {
    std::memcpy(seekBuf.data(), dryWork.data(), static_cast<size_t>(copySeek) * sizeof(float));
  }
  MonoChannelConst seekIn{seekBuf.data()};
  stretch.seek(seekIn, seekLen, 1.0);

  const unsigned int workHop = std::max(1u, hopSize / 2u);
  std::vector<float> outWork;
  outWork.reserve(static_cast<size_t>(workFrames) + static_cast<size_t>(outLatency) + 4096);
  std::vector<float> chunkOut(workHop, 0.0f);

  unsigned int frame = 0;
  while (frame < workFrames) {
    const unsigned int n = std::min(workHop, workFrames - frame);
    // Map half-rate frame → full-rate YIN hop.
    size_t hopIndex = static_cast<size_t>((frame * 2u) / hopSize);
    float cents = 0.0f;
    if (!centsPerHop.empty()) {
      if (hopIndex >= centsPerHop.size()) {
        hopIndex = centsPerHop.size() - 1;
      }
      cents = centsPerHop[hopIndex];
    }
    // Near-zero correction: still run stretch (phase continuity) but skip setTranspose churn.
    stretch.setTransposeSemitones(cents / 100.0f);

    if (chunkOut.size() < n) {
      chunkOut.assign(n, 0.0f);
    } else {
      std::fill(chunkOut.begin(), chunkOut.begin() + static_cast<std::ptrdiff_t>(n), 0.0f);
    }
    MonoChannelConst inCh{dryWork.data() + frame};
    MonoChannel outCh{chunkOut.data()};
    stretch.process(inCh, static_cast<int>(n), outCh, static_cast<int>(n));
    outWork.insert(outWork.end(), chunkOut.begin(), chunkOut.begin() + static_cast<std::ptrdiff_t>(n));
    frame += n;
  }

  const int drainIn = std::max(inLatency, static_cast<int>(workHop));
  std::vector<float> silence(static_cast<size_t>(drainIn), 0.0f);
  if (chunkOut.size() < static_cast<size_t>(drainIn)) {
    chunkOut.assign(static_cast<size_t>(drainIn), 0.0f);
  }
  int idle = 0;
  while (outWork.size() < workFrames + static_cast<size_t>(outLatency) && idle < 16) {
    const size_t before = outWork.size();
    std::fill(chunkOut.begin(), chunkOut.begin() + drainIn, 0.0f);
    MonoChannelConst inCh{silence.data()};
    MonoChannel outCh{chunkOut.data()};
    stretch.process(inCh, drainIn, outCh, drainIn);
    outWork.insert(outWork.end(), chunkOut.begin(), chunkOut.begin() + drainIn);
    if (outWork.size() == before) {
      ++idle;
    } else {
      idle = 0;
    }
  }

  {
    const int flushN = std::max(outLatency, static_cast<int>(workHop));
    if (chunkOut.size() < static_cast<size_t>(flushN)) {
      chunkOut.assign(static_cast<size_t>(flushN), 0.0f);
    } else {
      std::fill(chunkOut.begin(), chunkOut.begin() + flushN, 0.0f);
    }
    MonoChannel outCh{chunkOut.data()};
    stretch.flush(outCh, flushN, 1.0f);
    outWork.insert(outWork.end(), chunkOut.begin(), chunkOut.begin() + flushN);
  }

  const unsigned int skip =
    std::min(static_cast<unsigned int>(std::max(0, outLatency)), static_cast<unsigned int>(outWork.size()));

  // Upsample half-rate wet → full-rate with linear interpolation.
  std::vector<float> outMono(totalFrames, 0.0f);
  const unsigned int available = outWork.size() > skip ? static_cast<unsigned int>(outWork.size() - skip) : 0u;
  for (unsigned int i = 0; i < totalFrames; ++i) {
    const float src = static_cast<float>(i) * 0.5f;
    const unsigned int i0 = static_cast<unsigned int>(src);
    const float frac = src - static_cast<float>(i0);
    float wet = dryMono[i];
    if (i0 < available) {
      const float s0 = outWork[static_cast<size_t>(skip) + i0];
      if (i0 + 1u < available) {
        const float s1 = outWork[static_cast<size_t>(skip) + i0 + 1u];
        wet = s0 + (s1 - s0) * frac;
      } else {
        wet = s0;
      }
    }
    outMono[i] = wet;
  }

  rendered.assign(static_cast<size_t>(totalFrames) * 2u, 0.0f);
  const float wetAmt = params.wet;
  const float dryAmt = 1.0f - wetAmt;
  for (unsigned int i = 0; i < totalFrames; ++i) {
    const float dryL = original[static_cast<size_t>(i) * 2u];
    const float dryR = original[static_cast<size_t>(i) * 2u + 1u];
    const float wet = outMono[i];
    rendered[static_cast<size_t>(i) * 2u] = dryL * dryAmt + wet * wetAmt;
    rendered[static_cast<size_t>(i) * 2u + 1u] = dryR * dryAmt + wet * wetAmt;
  }
}
