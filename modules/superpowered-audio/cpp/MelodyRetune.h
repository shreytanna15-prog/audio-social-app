#pragma once

#include "PitchYin.h"

#include <cstdint>
#include <vector>

struct MelodyRetuneParams {
  float strength = 0.8f;
  float slewMs = 40.0f;
  float vibratoCents = 18.0f;
  float wet = 0.8f;
};

/**
 * Offline Hard/Natural: YIN pitch curve + Signalsmith Stretch pitch shift.
 * Analysis collects the take, renders a same-length retuned buffer, then process()
 * copies from that buffer in lockstep with the decoder.
 * Render uses half-rate + small STFT blocks for phone speed.
 */
struct MelodyRetuneEngine {
  bool active = false;
  unsigned int samplerate = 48000;
  MelodyRetuneParams params;
  PitchYinAnalyzer yin;
  std::vector<float> original;
  std::vector<float> rendered;
  uint64_t readPos = 0;

  void reset(unsigned int sr, const MelodyRetuneParams &next);
  void addAnalysis(const float *stereo, unsigned int frames);
  void finishAnalysis();
  void resetApply();
  void process(float *buffer, unsigned int frames);
  /** Peak/RMS of rendered wet — avoids a second full decode before write. */
  void measureRendered(float *peakOut, double *sumSquaresOut, uint64_t *sampleCountOut) const;
  unsigned int renderedFrames() const {
    return static_cast<unsigned int>(rendered.size() / 2u);
  }
  void destroy();

private:
  void render();
  static float targetHz(float hz);
};
