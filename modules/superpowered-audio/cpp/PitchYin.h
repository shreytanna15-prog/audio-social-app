#pragma once

#include <vector>

struct PitchHop {
  float hz = 0.0f;
  float confidence = 0.0f;
};

/** Streaming YIN pitch tracker for monophonic vocals (offline). */
class PitchYinAnalyzer {
public:
  void reset(unsigned int samplerate);
  void addStereo(const float *interleaved, unsigned int frames);
  void finish();
  void repairCurve();

  const std::vector<PitchHop> &hops() const { return hops_; }
  unsigned int hopSize() const { return static_cast<unsigned int>(hopSize_); }
  unsigned int samplerate() const { return samplerate_; }

private:
  PitchHop analyzeWindow(const float *mono) const;

  unsigned int samplerate_ = 48000;
  int windowSize_ = 2048;
  int hopSize_ = 512;
  int filled_ = 0;
  std::vector<float> window_;
  std::vector<PitchHop> hops_;
};
