#!/usr/bin/env python3
"""
Reverb analysis scorecard: dry vs Voloco reverb presets.

Usage:
  python -u test-audio/analyze_reverb.py
"""

from __future__ import annotations

import json
import math
import sys
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent / "reverb-test"
if len(sys.argv) > 1:
    ROOT = Path(sys.argv[1])

PRESETS = [
    "reverb-stereo-width",
    "reverb-large-hall",
    "reverb-small-club",
    "reverb-long-and-narrow",
    "reverb-cathedral",
    "reverb-medium-room",
]


def load_wav(path: Path):
    with wave.open(str(path), "rb") as w:
        ch, sw, sr, n = w.getparams()[:4]
        raw = w.readframes(n)
    if sw != 2:
        raise SystemExit(f"{path}: need 16-bit PCM")
    samples = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    stereo = samples.reshape(-1, ch) if ch > 1 else samples.reshape(-1, 1)
    left = stereo[:, 0]
    right = stereo[:, -1]
    mono = stereo.mean(axis=1)
    return {
        "path": path,
        "sr": sr,
        "ch": ch,
        "left": left,
        "right": right,
        "mono": mono,
        "dur": len(mono) / sr,
    }


def bands(mono: np.ndarray, sr: int):
    block = 2048
    lows, mids, highs = [], [], []
    win = np.hanning(block)
    for i in range(0, len(mono) - block, block):
        fr = mono[i : i + block] * win
        sp = np.abs(np.fft.rfft(fr)) + 1e-12
        freqs = np.fft.rfftfreq(block, 1 / sr)
        low = float(sp[(freqs >= 80) & (freqs < 400)].sum())
        mid = float(sp[(freqs >= 400) & (freqs < 2000)].sum())
        high = float(sp[(freqs >= 2000) & (freqs < 8000)].sum())
        tot = low + mid + high + 1e-12
        lows.append(low / tot)
        mids.append(mid / tot)
        highs.append(high / tot)
    return (
        100 * float(np.mean(lows)),
        100 * float(np.mean(mids)),
        100 * float(np.mean(highs)),
    )


def stereo_stats(left: np.ndarray, right: np.ndarray):
    n = min(len(left), len(right))
    l, r = left[:n].astype(np.float64), right[:n].astype(np.float64)
    if n < 8:
        return 1.0, 0.0
    corr = float(np.corrcoef(l, r)[0, 1])
    if math.isnan(corr):
        corr = 1.0
    # Mid/side width proxy
    mid = 0.5 * (l + r)
    side = 0.5 * (l - r)
    mid_e = float(np.mean(mid**2)) + 1e-12
    side_e = float(np.mean(side**2))
    ms_ratio = side_e / mid_e
    width = max(0.0, min(1.0, 1.0 - abs(corr)))
    return corr, width, ms_ratio


def tail_pct(mono: np.ndarray):
    cut = int(len(mono) * 0.75)
    total = float(np.sum(mono**2)) + 1e-12
    return 100 * float(np.sum(mono[cut:] ** 2)) / total


def align_and_level_match(dry: np.ndarray, wet: np.ndarray, sr: int):
    """Rough time align via cross-corr (max +/- 100ms) then match RMS."""
    max_lag = int(0.1 * sr)
    n = min(len(dry), len(wet))
    d = dry[:n].astype(np.float64)
    w = wet[:n].astype(np.float64)
    # Use downsampled corr for speed
    step = max(1, sr // 4000)
    ds, ws = d[::step], w[::step]
    corr = np.correlate(ws - ws.mean(), ds - ds.mean(), mode="full")
    center = len(ds) - 1
    lo = max(0, center - max_lag // step)
    hi = min(len(corr), center + max_lag // step + 1)
    lag_ds = int(np.argmax(corr[lo:hi]) + lo - center)
    lag = lag_ds * step
    if lag >= 0:
        w2 = w[lag:]
        d2 = d[: len(w2)]
    else:
        d2 = d[-lag:]
        w2 = w[: len(d2)]
    n2 = min(len(d2), len(w2))
    d2, w2 = d2[:n2], w2[:n2]
    dry_rms = float(np.sqrt(np.mean(d2**2))) + 1e-12
    wet_rms = float(np.sqrt(np.mean(w2**2))) + 1e-12
    scale = dry_rms / wet_rms
    w2n = w2 * scale
    residual = w2n - d2
    res_rms = float(np.sqrt(np.mean(residual**2)))
    # similarity of shapes after level match
    sim = float(np.corrcoef(d2, w2n)[0, 1])
    return {
        "lag_samples": lag,
        "lag_ms": round(1000 * lag / sr, 1),
        "level_scale": round(scale, 3),
        "residual_rms": round(res_rms, 4),
        "residual_ratio": round(res_rms / dry_rms, 4),
        "shape_corr": round(sim if not math.isnan(sim) else 0.0, 3),
        "dry_aligned": d2.astype(np.float32),
        "wet_aligned": w2n.astype(np.float32),
    }


def base_metrics(name: str, mono, left, right, sr, dur):
    peak = float(np.max(np.abs(mono)))
    rms = float(np.sqrt(np.mean(mono**2)))
    low, mid, high = bands(mono, sr)
    corr, width, ms_ratio = stereo_stats(left, right)
    return {
        "name": name,
        "sr": sr,
        "dur_s": round(dur, 2),
        "peak": round(peak, 4),
        "rms": round(rms, 4),
        "crest": round(peak / (rms + 1e-12), 2),
        "low_pct": round(low, 1),
        "mid_pct": round(mid, 1),
        "high_pct": round(high, 1),
        "stereo_corr": round(corr, 3),
        "stereo_width": round(width, 3),
        "ms_side_ratio": round(ms_ratio, 4),
        "tail_pct": round(tail_pct(mono), 1),
    }


def analyze_vs_dry(name: str, audio: dict, dry: dict) -> dict:
    m = base_metrics(name, audio["mono"], audio["left"], audio["right"], audio["sr"], audio["dur"])
    al = align_and_level_match(dry["mono"], audio["mono"], dry["sr"])
    m.update(
        {
            "lag_ms": al["lag_ms"],
            "level_scale_to_dry": al["level_scale"],
            "residual_rms": al["residual_rms"],
            "residual_ratio": al["residual_ratio"],
            "shape_corr_vs_dry": al["shape_corr"],
        }
    )
    # Character distance AFTER level match (reverb-relevant)
    dw = al["wet_aligned"]
    dd = al["dry_aligned"]
    w_low, w_mid, w_high = bands(dw, dry["sr"])
    d_low, d_mid, d_high = bands(dd, dry["sr"])
    w_tail = tail_pct(dw)
    d_tail = tail_pct(dd)
    # stereo on full files (not aligned crop) already in m
    char_dist = (
        35 * al["residual_ratio"]
        + 0.4 * abs(w_low - d_low)
        + 0.4 * abs(w_high - d_high)
        + 0.2 * abs(w_tail - d_tail)
        + 15 * abs(m["stereo_width"] - base_metrics("d", dry["mono"], dry["left"], dry["right"], dry["sr"], dry["dur"])["stereo_width"])
        + 8 * abs(m["ms_side_ratio"] - stereo_stats(dry["left"], dry["right"])[2])
    )
    m["character_distance"] = round(float(char_dist), 2)
    m["different_from_dry"] = bool(al["residual_ratio"] >= 0.06 or char_dist >= 2.5)
    m["aligned_low_pct"] = round(w_low, 1)
    m["aligned_high_pct"] = round(w_high, 1)
    m["aligned_tail_pct"] = round(w_tail, 1)
    return m


def feat(r: dict) -> np.ndarray:
    return np.array(
        [
            r["residual_ratio"],
            r["aligned_tail_pct"] / 100,
            r["stereo_width"],
            r["ms_side_ratio"],
            r["aligned_low_pct"] / 100,
            r["aligned_high_pct"] / 100,
            1.0 - r["shape_corr_vs_dry"],
        ],
        dtype=np.float64,
    )


def main():
    dry = load_wav(ROOT / "dry.wav")
    dry_m = base_metrics("dry", dry["mono"], dry["left"], dry["right"], dry["sr"], dry["dur"])
    print("=== DRY ===")
    print(
        f"{dry_m['name']:<24} peak={dry_m['peak']} rms={dry_m['rms']} "
        f"tail={dry_m['tail_pct']} width={dry_m['stereo_width']} "
        f"ms={dry_m['ms_side_ratio']} low={dry_m['low_pct']} high={dry_m['high_pct']}"
    )
    print()
    print("=== VOLOCO REVERBS (level-matched vs dry) ===")
    print(
        f"{'preset':<24} {'res%':>6} {'shape':>6} {'char':>6} {'tail':>6} "
        f"{'width':>6} {'ms':>7} {'low':>5} {'high':>5} {'vs dry':>8}"
    )
    rows = []
    for name in PRESETS:
        path = ROOT / f"{name}.wav"
        if not path.exists():
            print("MISSING", path)
            continue
        audio = load_wav(path)
        m = analyze_vs_dry(name, audio, dry)
        rows.append(m)
        print(
            f"{m['name']:<24} {100*m['residual_ratio']:6.1f} {m['shape_corr_vs_dry']:6.3f} "
            f"{m['character_distance']:6.2f} {m['aligned_tail_pct']:6.1f} "
            f"{m['stereo_width']:6.3f} {m['ms_side_ratio']:7.4f} "
            f"{m['aligned_low_pct']:5.1f} {m['aligned_high_pct']:5.1f} "
            f"{'DIFF' if m['different_from_dry'] else 'SIMILAR':>8}"
        )

    print()
    print("=== RANKINGS ===")
    if rows:
        print(
            "Most wet residual:",
            ", ".join(f"{r['name'].replace('reverb-','')}({r['residual_ratio']})" for r in sorted(rows, key=lambda x: -x["residual_ratio"])),
        )
        print(
            "Most character change:",
            ", ".join(f"{r['name'].replace('reverb-','')}({r['character_distance']})" for r in sorted(rows, key=lambda x: -x["character_distance"])),
        )
        print(
            "Widest (1-corr):",
            ", ".join(f"{r['name'].replace('reverb-','')}({r['stereo_width']})" for r in sorted(rows, key=lambda x: -x["stereo_width"])),
        )
        print(
            "Most side energy:",
            ", ".join(f"{r['name'].replace('reverb-','')}({r['ms_side_ratio']})" for r in sorted(rows, key=lambda x: -x["ms_side_ratio"])),
        )

    print()
    print("=== PRESET vs PRESET DISTANCE (0 = identical character) ===")
    if len(rows) >= 2:
        short = [r["name"].replace("reverb-", "")[:10] for r in rows]
        print(f"{'':12}", " ".join(f"{s:>10}" for s in short))
        near = 0
        total = 0
        for i, a in enumerate(rows):
            cells = []
            for j, b in enumerate(rows):
                d = float(np.linalg.norm(feat(a) - feat(b)))
                cells.append(f"{d:10.3f}")
                if i < j:
                    total += 1
                    if d < 0.03:
                        near += 1
                        print(f"NEAR-IDENTICAL: {a['name']} ~= {b['name']} (d={d:.4f})")
            print(f"{short[i]:<12}", " ".join(cells))
        print()
        if near == 0:
            print("All 6 presets are measurably distinct from each other.")
        else:
            print(f"{near}/{total} pairs are near-identical on these metrics.")

    print()
    print("=== HOW TO READ ===")
    print("res%     = residual after time+level match (wet amount proxy)")
    print("shape    = correlation vs dry after level match (1 = same dry core)")
    print("char     = character distance (bands/tail/stereo/residual)")
    print("width    = 1 - |L/R corr| ; ms = side/mid energy")
    print("DIFF     = clearly different from dry")

    out = ROOT / "reverb_analysis.json"
    out.write_text(json.dumps({"dry": dry_m, "presets": rows}, indent=2), encoding="utf-8")
    print()
    print("wrote", out)


if __name__ == "__main__":
    main()
