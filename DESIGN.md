---
name: Studio Noir Atmosphere
colors:
  surface: '#131319'
  surface-dim: '#131319'
  surface-bright: '#39383f'
  surface-container-lowest: '#0e0e14'
  surface-container-low: '#1b1b21'
  surface-container: '#1f1f25'
  surface-container-high: '#2a2930'
  surface-container-highest: '#34343b'
  on-surface: '#e4e1ea'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#e4e1ea'
  inverse-on-surface: '#303036'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#ffb0cd'
  on-secondary: '#640039'
  secondary-container: '#aa0266'
  on-secondary-container: '#ffbad3'
  tertiary: '#ccbeff'
  on-tertiary: '#332664'
  tertiary-container: '#9587cc'
  on-tertiary-container: '#2c1f5c'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#ffd9e4'
  secondary-fixed-dim: '#ffb0cd'
  on-secondary-fixed: '#3e0022'
  on-secondary-fixed-variant: '#8c0053'
  tertiary-fixed: '#e7deff'
  tertiary-fixed-dim: '#ccbeff'
  on-tertiary-fixed: '#1e0e4e'
  on-tertiary-fixed-variant: '#4a3d7c'
  background: '#131319'
  on-background: '#e4e1ea'
  surface-variant: '#34343b'
typography:
  display-hero:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  mono-metric:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.05em
  caption:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

# VibeOGram — Studio Noir Atmosphere

The design system establishes a high-fidelity, studio-grade aesthetic tailored for music creators, vocalists, and sonic artists. It evokes the tactile intimacy of a late-night recording booth merged with the sleek responsiveness of modern creative software. The emotional tone is focused, evocative, and luxurious: the interface recedes gracefully into the background, providing an atmospheric canvas where creator identities, audio waveforms, and cover artwork stand as the undisputed heroes.

## Implementation map (app)

Tokens live in:

- `src/global.css` — NativeWind / Tailwind CSS variables (`bg-primary`, `text-on-surface`, …)
- `src/core/theme/` — TypeScript mirrors for StyleSheet / non-Tailwind usage
- `src/shared/lib/theme.ts` — navigation + shared theme object

### Brand signal aliases (palette board)

| Token | Hex | Use |
| --- | --- | --- |
| `brand` / CTA `primary` | `#8B5CF6` | Master CTAs, playheads, active nav |
| `brand-deep` | `#7C3AED` | Gradient end / pressed primary |
| `magenta` | `#EC4899` | Creative highlights, reactions |
| `lavender` | `#C4B5FD` | Badges, soft chips, icon fills |
| `neutral` | `#121218` | Main canvas (aligned with surface) |
| `canvas` | `#0B0B0F` | Level-0 deepest ground |

### Studio functional metrics

| Token | Hex | Use |
| --- | --- | --- |
| `recording` | `#EF4444` | Record arm / live capture |
| `monitor` | `#10B981` | Good signal |
| `peak` | `#F59E0B` | Limiter / warning |
| `ink` | `#F8FAFC` | High-priority text |
| `slate` | `#94A3B8` | Secondary metadata |
| `slate-muted` | `#475569` | Timestamps / disabled |

## Brand & Style

Aesthetic rules:

- **Style Foundation:** Layered dark minimalism with refined glassmorphism and precision hardware metaphors.
- **Restraint Over Noise:** Avoid heavy cyberpunk tropes, game-like HUDs, or ubiquitous neon glows. Use emission, gradients, and soft radial blurs selectively—strictly to indicate active sonic states, recording loops, or primary tactile interactions.
- **Audience Resonance:** Caters to serious creators and discerning listeners. Visual structures emphasize precision, metadata clarity, and tactile playback ergonomics.

## Colors

The palette is engineered around low-energy, deep-spectrum darkness that minimizes eye fatigue during prolonged production and listening sessions.

- **Base Surfaces:** The deepest ground sits at `#0B0B0F`, stepping up to `#121218` / `#131319` for main view canvases, `#1A1A24` for grouped panels, and `#222230` for floating surfaces. Outlines and subtle divider borders rely on low-opacity delineations (`#2A2A3C` or `rgba(255, 255, 255, 0.08)`).
- **Core Signal (Electric Violet — `#8B5CF6` / `#7C3AED`):** The operational core. Applied to master CTAs, active track playheads, scrubber fills, and primary navigation states.
- **Expressive Resonance (Electric Magenta — `#EC4899` / `#D946EF`):** Applied exclusively to creative highlights, collaborative drops, community pulse reactions, and dynamic studio tags.
- **Harmonic Neutralizer (Lavender — `#C4B5FD`):** Tonal badge backgrounds, active icon fills, and low-contrast audio metadata chips.
- **Typography & Neutrals:** Absolute high-priority text is Off-White (`#F8FAFC`). Supporting track metadata and secondary copy rest at Cool Gray (`#94A3B8`). Timestamps and disabled indicators resolve at Muted Slate (`#475569`).
- **Studio Functional Metrics:**
  - Recording State: `#EF4444` (Vivid Studio Red)
  - Active Monitor / Good Signal: `#10B981` (Monitor Emerald)
  - Peak / Limiter / Warning: `#F59E0B` (Warm Amber Gold)

## Typography

Typography blends mechanical clarity with musical soul.

- **Space Grotesk** is deployed intentionally for high-impact brand statements, release titles, artist hero headers, and numeric studio metrics (BPM, decibel readouts, project timecodes).
- **Inter** handles high-density interactive UI, lyric lines, commentary, form controls, and multi-track metadata tables.
- **Editorial Balance:** Maintain tight tracking on Space Grotesk display weights to preserve structural mass. For body copy and metadata timestamps, use standard tracking with neutral tabular alignment for audio counters.

## Layout & Spacing

The layout is built on an adaptive fluid-grid framework paired with a strict 4px base spatial unit (`0.25rem`).

- **Grid Systems:**
  - **Mobile (< 768px):** 4 fluid columns, 16px margins, 16px gutters. Single-column stacked feeds, edge-to-edge waveform visualizers, sticky bottom audio player docks with safe-area spacing (min 34px bottom inset).
  - **Tablet (768px - 1024px):** 8 fluid columns, 32px margins, 20px gutters. Dual-pane studio environments.
  - **Desktop (> 1024px):** 12 fluid columns with max bounded content width of 1440px.
- **Vertical Rhythm:** Tight 8px (`space-sm`) gaps between related track metadata items; standard 16px (`space-md`) padding inside modules; 40px (`space-xl`) between distinct stage sections.

## Elevation & Depth

Visual depth is achieved through optical surface layering and luminous diffusion rather than harsh drop-shadows.

- **Level 0 (Canvas Base):** Solid `#0B0B0F`. Non-elevated foundation.
- **Level 1 (Docked Containers & Feed Cards):** `#121218` background, 1px perimeter border `rgba(255, 255, 255, 0.05)`. Zero shadow.
- **Level 2 (Studio Modules & Floating Panels):** `#1A1A24` at 85% opacity with blur(16px) and border `rgba(255, 255, 255, 0.1)`. Shadow: `0 8px 32px rgba(0, 0, 0, 0.45)`.
- **Level 3 (Modal Overlays, Active Mini-Player Dock):** `#222230` at 75% opacity, blur(24px). Rim border `rgba(139, 92, 246, 0.2)`. Shadow: `0 16px 48px rgba(0, 0, 0, 0.65)`.
- **Active State Highlights:** Subtle 12px ambient glow for selected/recording states (Violet or Record Red at ~20% opacity).

## Shapes

- **Cards, Studio Panels:** `rounded-lg` (16px) and `rounded-xl` (24px).
- **Interactive Triggers, Badges, Transport:** `rounded-full`.
- **Waveform bars:** 2px–4px micro-radii.

## Components

### Buttons & Transport Controls

- **Primary Action:** Solid `#8B5CF6` → `#7C3AED` gradient, `#F8FAFC` label. Pill or 12px squircle. Min touch 48×48.
- **Secondary / Studio Transport:** Glass `rgba(255, 255, 255, 0.06)`, border `rgba(255, 255, 255, 0.12)`.
- **Record Trigger:** Idle outlined `#EF4444`; active pulsing red beacon.

### Waveform Visualizer & Scrubbers

- Unplayed: `rgba(255, 255, 255, 0.2)`. Played: `#8B5CF6` with 1px white playhead needle.

### Cards (Track & Session Feed)

- Background `#1A1A24`, border `rgba(255, 255, 255, 0.07)`, 16px padding. Cover 1:1 with 12px radius.

### Inputs

- Inset `#0B0B0F`, border `#2A2A3C`. Focus: border `#8B5CF6` + faint 3px outer glow.

### Tags, Chips & Reaction Pills

- Default: `#1A1A24` / `#94A3B8`. Active: `rgba(196, 181, 253, 0.15)` bg, `#DDD6FE` text.

### Floating Mini-Player Dock

- 64px height, glass `#121218` @ 90%, 16px above bottom safe area.
