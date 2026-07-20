#include "SpectralClean.h"

#include <algorithm>
#include <chrono>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <string>
#include <vector>

#include "SpectralGate.h"
#include "Superpowered.h"
#include "SuperpoweredDecoder.h"
#include "SuperpoweredPolish.h"
#include "SuperpoweredSimple.h"

#if defined(__ANDROID__)
#include <android/log.h>
#define SPECTRAL_LOG(...) __android_log_print(ANDROID_LOG_INFO, "SpectralClean", __VA_ARGS__)
#else
#define SPECTRAL_LOG(...) do { std::fprintf(stderr, "[SpectralClean] "); std::fprintf(stderr, __VA_ARGS__); std::fprintf(stderr, "\n"); } while (0)
#endif

namespace {

char gLastError[512] = {0};
char gLastStats[512] = {0};

void setError(const char *message) {
  if (message == nullptr) {
    gLastError[0] = '\0';
    return;
  }
  std::snprintf(gLastError, sizeof(gLastError), "%s", message);
}

void setStats(const char *message) {
  if (message == nullptr) {
    gLastStats[0] = '\0';
    return;
  }
  std::snprintf(gLastStats, sizeof(gLastStats), "%s", message);
}

std::string stripFileUri(const char *path) {
  if (path == nullptr) {
    return {};
  }
  std::string value(path);
  const char *prefix = "file://";
  if (value.rfind(prefix, 0) == 0) {
    value.erase(0, std::strlen(prefix));
  }
  return value;
}

} // namespace

extern "C" const char *SpectralClean_lastError(void) {
  return gLastError;
}

extern "C" const char *SpectralClean_lastStats(void) {
  return gLastStats;
}

extern "C" int SpectralClean_processFile(const char *inputPath, const char *outputWavPath) {
  const auto startedAt = std::chrono::steady_clock::now();
  setStats(nullptr);

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

  Superpowered::Decoder *decoder = new Superpowered::Decoder();
  const int openReturn = decoder->open(input.c_str());
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
  int durationHint = decoder->getDurationFrames();
  if (durationHint < 1) {
    durationHint = (int)(samplerate * 60);
  }

  std::vector<float> mono;
  mono.reserve((size_t)durationHint + 4096);

  const unsigned int framesPerChunk = decoder->getFramesPerChunk();
  short int *intBuffer = (short int *)std::malloc(framesPerChunk * 2 * sizeof(short int) + 16384);
  float *floatBuffer = (float *)std::malloc(framesPerChunk * 2 * sizeof(float) + 16384);

  if (intBuffer == nullptr || floatBuffer == nullptr) {
    setError("Out of memory allocating decode buffers.");
    std::free(intBuffer);
    std::free(floatBuffer);
    delete decoder;
    return 5;
  }

  while (true) {
    const int framesDecoded = decoder->decodeAudio(intBuffer, framesPerChunk);
    if (framesDecoded < 1) {
      break;
    }

    const unsigned int frames = (unsigned int)framesDecoded;
    Superpowered::ShortIntToFloat(intBuffer, floatBuffer, frames);

    for (unsigned int i = 0; i < frames; ++i) {
      const float l = floatBuffer[i * 2];
      const float r = floatBuffer[i * 2 + 1];
      mono.push_back(0.5f * (l + r));
    }
  }

  std::free(intBuffer);
  std::free(floatBuffer);
  delete decoder;

  if (mono.empty()) {
    setError("Decoded audio is empty.");
    return 6;
  }

  const SpectralGateParams params = SpectralGate_instrumentDefaults();
  SpectralGateStats gateStats = {};
  if (!SpectralGate_processMonoInPlace(mono.data(), mono.size(), samplerate, &params, &gateStats)) {
    setError("Spectral gate failed.");
    return 7;
  }

  FILE *destinationFile = Superpowered::createWAV(output.c_str(), samplerate, 2);
  if (!destinationFile) {
    setError("Could not create output WAV file.");
    return 4;
  }

  const size_t writeChunk = 4096;
  std::vector<short int> outInt(writeChunk * 2);
  std::vector<float> outFloat(writeChunk * 2);

  for (size_t offset = 0; offset < mono.size(); offset += writeChunk) {
    const size_t frames = std::min(writeChunk, mono.size() - offset);
    for (size_t i = 0; i < frames; ++i) {
      const float s = mono[offset + i];
      outFloat[i * 2] = s;
      outFloat[i * 2 + 1] = s;
    }
    Superpowered::FloatToShortInt(outFloat.data(), outInt.data(), (unsigned int)frames);
    Superpowered::writeWAV(destinationFile, outInt.data(), (unsigned int)(frames * 4));
  }

  Superpowered::closeWAV(destinationFile);

  const auto elapsedMs = std::chrono::duration_cast<std::chrono::milliseconds>(
    std::chrono::steady_clock::now() - startedAt
  ).count();

  char statsBuffer[512];
  std::snprintf(
    statsBuffer,
    sizeof(statsBuffer),
    "strategy=interference-soften prop_decrease=%.2f hiss_prop=%.2f hiss_hz=%.0f-%.0f "
    "scale=%.1f rise_alpha=%.4f thresh=%.1f peak_target=%.2f gain=%.2f peak_before=%.3f peak_after=%.3f "
    "frames=%u transients=%u duration_ms=%lld",
    gateStats.propDecrease,
    params.hissPropDecrease,
    params.hissStartHz,
    params.hissFullHz,
    params.scaleFactor,
    gateStats.riseAlpha,
    gateStats.transientThreshold,
    gateStats.peakTarget,
    gateStats.peakGainApplied,
    gateStats.peakBefore,
    gateStats.peakAfter,
    gateStats.noiseProfileFrames,
    gateStats.transientCount,
    (long long)elapsedMs
  );
  setStats(statsBuffer);
  SPECTRAL_LOG("%s", statsBuffer);

  setError(nullptr);
  return 0;
}
