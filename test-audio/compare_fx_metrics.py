#!/usr/bin/env python3
"""Compare FX-only WAVs after metric-driven Path 1 tune.

Usage (after native rebuild + re-export):
  python test-audio/compare_fx_metrics.py test-audio/test-voloco.wav test-audio/test-our-app.wav
"""

from __future__ import annotations

import math
import sys
import wave
from pathlib import Path

import numpy as np


def load_mono(path: Path):
    with wave.open(str(path), "rb") as w:
        ch, sw, sr, n = w.getparams()[:4]
        raw = w.readframes(n)
    if sw != 2:
        raise SystemExit(f"{path}: need 16-bit PCM, got width={sw}")
    samples = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    mono = samples.reshape(-1, ch).mean(axis=1) if ch > 1 else samples
    return mono, sr


def analyze(name: str, path: Path) -> dict:
    mono, sr = load_mono(path)
    peak = float(np.max(np.abs(mono)))
    rms = float(np.sqrt(np.mean(mono**2)))
    hop = int(0.04 * sr)
    win = int(0.04 * sr)
    f0s = []
    for i in range(0, len(mono) - win, hop):
        frame = mono[i : i + win]
        if np.sqrt(np.mean(frame**2)) < 0.02:
            f0s.append(0.0)
            continue
        frame = frame - frame.mean()
        min_tau = int(sr / 500)
        max_tau = int(sr / 80)
        corr = np.correlate(frame, frame, mode="full")
        corr = corr[len(corr) // 2 :]
        seg = corr[min_tau:max_tau]
        if len(seg) == 0:
            f0s.append(0.0)
            continue
        tau = int(np.argmax(seg)) + min_tau
        conf = float(seg.max() / (corr[0] + 1e-12))
        f0s.append(sr / tau if conf > 0.3 else 0.0)
    f0a = np.array(f0s)
    voiced = f0a[f0a > 0]
    block = 2048
    lows, highs = [], []
    for i in range(0, len(mono) - block, block):
        fr = mono[i : i + block] * np.hanning(block)
        sp = np.abs(np.fft.rfft(fr)) + 1e-12
        freqs = np.fft.rfftfreq(block, 1 / sr)
        low = float(sp[(freqs >= 80) & (freqs < 400)].sum())
        mid = float(sp[(freqs >= 400) & (freqs < 2000)].sum())
        high = float(sp[(freqs >= 2000) & (freqs < 8000)].sum())
        tot = low + mid + high + 1e-12
        lows.append(low / tot)
        highs.append(high / tot)
    out = {
        "name": name,
        "peak": round(peak, 4),
        "rms": round(rms, 4),
        "band_low_pct": round(100 * float(np.mean(lows)), 1),
        "band_high_pct": round(100 * float(np.mean(highs)), 1),
    }
    if len(voiced):
        diffs = np.abs(np.diff(voiced))
        out["f0_step_p90_hz"] = round(float(np.percentile(diffs, 90)), 2)
        out["f0_max"] = round(float(voiced.max()), 1)
    return out


def main() -> None:
    if len(sys.argv) != 3:
        print(__doc__)
        raise SystemExit(1)
    vol = analyze("VOLOCO", Path(sys.argv[1]))
    app = analyze("OUR-APP", Path(sys.argv[2]))
    print(vol)
    print(app)
    print("--- targets ---")
    print("peak <= ~0.5:", app["peak"] <= 0.5)
    print("rms ~0.06-0.12:", 0.05 <= app["rms"] <= 0.14)
    print("low band up:", app["band_low_pct"] >= 18)
    print("high band down:", app["band_high_pct"] <= 38)
    if "f0_step_p90_hz" in app:
        print("f0_step_p90 <= ~35:", app["f0_step_p90_hz"] <= 35)


if __name__ == "__main__":
    main()
