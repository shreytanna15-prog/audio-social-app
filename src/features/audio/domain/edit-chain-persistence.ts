import {
  clampCompParams,
  clampEchoParams,
  clampEqParams,
  clampFxParams,
  clampReverbParams,
  defaultCompParams,
  defaultEchoParams,
  defaultEqParams,
  defaultFxParams,
  defaultReverbParams,
} from '@/features/audio/domain/chip-tune-params';
import {
  COMPRESSOR_PRESETS,
  ECHO_PRESETS,
  EMPTY_EDIT_CHAIN,
  EQ_PRESETS,
  FX_PRESETS,
  FX_SCALES,
  isEditChainEmpty,
  REVERB_PRESETS,
  type CompressorPresetId,
  type CompressorSelection,
  type EchoPresetId,
  type EchoSelection,
  type EditChainSelection,
  type EqPresetId,
  type EqSelection,
  type FxPresetId,
  type FxScaleId,
  type FxSelection,
  type ReverbPresetId,
  type ReverbSelection,
  type StoredEditChain,
} from '@/features/audio/types/edit-chips';

function isCompressorPresetId(value: unknown): value is CompressorPresetId {
  return COMPRESSOR_PRESETS.some((item) => item.id === value);
}

function isEqPresetId(value: unknown): value is EqPresetId {
  return EQ_PRESETS.some((item) => item.id === value);
}

function isEchoPresetId(value: unknown): value is EchoPresetId {
  return ECHO_PRESETS.some((item) => item.id === value);
}

function isReverbPresetId(value: unknown): value is ReverbPresetId {
  return REVERB_PRESETS.some((item) => item.id === value);
}

function isFxScaleId(value: unknown): value is FxScaleId {
  return FX_SCALES.some((item) => item.id === value);
}

function isFxPresetId(value: unknown): value is FxPresetId {
  return FX_PRESETS.some((item) => item.id === value);
}

/** Map legacy Hard/Natural Snap / dropped Super Vocoder ids. */
function migrateFxPresetId(value: unknown): FxPresetId | null {
  if (isFxPresetId(value)) {
    return value;
  }
  if (value === 'hard-snap') {
    return 'hard-tune';
  }
  if (value === 'natural-snap') {
    return 'natural-tune';
  }
  // Dropped preset — clear FX rather than map to a different style.
  if (value === 'super-vocoder') {
    return null;
  }
  return null;
}

function parseFx(value: unknown): FxSelection | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<FxSelection> & { params?: unknown };
  const preset = migrateFxPresetId(candidate.preset);
  if (!preset) {
    return null;
  }
  // Legacy Key scale ids → chromatic (Key UI removed; Autotune chip dropped).
  if (candidate.scale != null && !isFxScaleId(candidate.scale) && candidate.scale !== 'chromatic') {
    // Accept any old scale string by collapsing to chromatic.
  }

  const rawParams =
    candidate.params && typeof candidate.params === 'object'
      ? (candidate.params as Partial<FxSelection['params']>)
      : defaultFxParams(preset);

  return {
    preset,
    scale: 'chromatic',
    params: clampFxParams(rawParams),
  };
}

/** Map legacy mix preset ids → Voloco free names (v5). */
function migrateCompressorPresetId(value: unknown): CompressorPresetId | null {
  if (isCompressorPresetId(value)) {
    return value;
  }
  if (value === 'gentle') {
    return 'moderate';
  }
  if (value === 'punch') {
    return 'blasted';
  }
  return null;
}

function migrateEqPresetId(value: unknown): EqPresetId | null {
  if (isEqPresetId(value)) {
    return value;
  }
  if (value === 'warm-bass') {
    return 'low-high-boost';
  }
  if (value === 'clear-notes' || value === 'vocal-presence') {
    return 'vocal-clarity';
  }
  if (value === 'bright') {
    return 'brightness';
  }
  return null;
}

function migrateEchoPresetId(value: unknown): EchoPresetId | null {
  if (isEchoPresetId(value)) {
    return value;
  }
  if (value === 'slapback') {
    return 'resonant-buzz';
  }
  if (value === 'bounce') {
    return 'eighth-note-bounce';
  }
  if (value === 'classic') {
    return 'coin-drop';
  }
  return null;
}

function migrateReverbPresetId(value: unknown): ReverbPresetId | null {
  if (isReverbPresetId(value)) {
    return value;
  }
  if (value === 'room') {
    return 'medium-room';
  }
  if (value === 'hall') {
    return 'large-hall';
  }
  return null;
}

function parseCompressorSelection(value: unknown): CompressorSelection | null {
  if (typeof value === 'string') {
    const preset = migrateCompressorPresetId(value);
    return preset ? { preset, params: defaultCompParams(preset) } : null;
  }
  if (!value || typeof value !== 'object') {
    return null;
  }
  const candidate = value as { preset?: unknown; params?: unknown };
  const preset = migrateCompressorPresetId(candidate.preset);
  if (!preset) {
    return null;
  }
  const raw =
    candidate.params && typeof candidate.params === 'object'
      ? (candidate.params as Partial<CompressorSelection['params']>)
      : defaultCompParams(preset);
  return { preset, params: clampCompParams(raw) };
}

function parseEqSelection(value: unknown): EqSelection | null {
  if (typeof value === 'string') {
    const preset = migrateEqPresetId(value);
    return preset ? { preset, params: defaultEqParams(preset) } : null;
  }
  if (!value || typeof value !== 'object') {
    return null;
  }
  const candidate = value as { preset?: unknown; params?: unknown };
  const preset = migrateEqPresetId(candidate.preset);
  if (!preset) {
    return null;
  }
  const raw =
    candidate.params && typeof candidate.params === 'object'
      ? (candidate.params as Partial<EqSelection['params']>)
      : defaultEqParams(preset);
  return { preset, params: clampEqParams(raw) };
}

function parseEchoSelection(value: unknown): EchoSelection | null {
  if (typeof value === 'string') {
    const preset = migrateEchoPresetId(value);
    return preset ? { preset, params: defaultEchoParams(preset) } : null;
  }
  if (!value || typeof value !== 'object') {
    return null;
  }
  const candidate = value as { preset?: unknown; params?: unknown };
  const preset = migrateEchoPresetId(candidate.preset);
  if (!preset) {
    return null;
  }
  const raw =
    candidate.params && typeof candidate.params === 'object'
      ? (candidate.params as Partial<EchoSelection['params']>)
      : defaultEchoParams(preset);
  return { preset, params: clampEchoParams(raw) };
}

function parseReverbSelection(value: unknown): ReverbSelection | null {
  if (typeof value === 'string') {
    const preset = migrateReverbPresetId(value);
    return preset ? { preset, params: defaultReverbParams(preset) } : null;
  }
  if (!value || typeof value !== 'object') {
    return null;
  }
  const candidate = value as { preset?: unknown; params?: unknown };
  const preset = migrateReverbPresetId(candidate.preset);
  if (!preset) {
    return null;
  }
  const raw =
    candidate.params && typeof candidate.params === 'object'
      ? (candidate.params as Partial<ReverbSelection['params']>)
      : defaultReverbParams(preset);
  return { preset, params: clampReverbParams(raw) };
}

/** Migrate v2 fx { preset, scale } → fx only (Autotune chip dropped). */
function migrateV2Fx(value: unknown): FxSelection | null {
  return parseFx(value);
}

/** Migrate v3 fx preset-only → { preset, chromatic scale }. */
function migrateV3Fx(fxValue: unknown): FxSelection | null {
  const preset = migrateFxPresetId(fxValue);
  if (!preset) {
    return null;
  }

  return {
    preset,
    scale: 'chromatic',
    params: defaultFxParams(preset),
  };
}

function parseMixSelections(stored: {
  compressor?: unknown;
  eq?: unknown;
  echo?: unknown;
  reverb?: unknown;
}): Pick<EditChainSelection, 'compressor' | 'eq' | 'echo' | 'reverb'> {
  return {
    compressor: parseCompressorSelection(stored.compressor),
    eq: parseEqSelection(stored.eq),
    echo: parseEchoSelection(stored.echo),
    reverb: parseReverbSelection(stored.reverb),
  };
}

export function toStoredEditChain(
  selection: EditChainSelection,
): StoredEditChain | undefined {
  if (isEditChainEmpty(selection)) {
    return undefined;
  }

  return {
    version: 7,
    cleanVoice: selection.cleanVoice,
    fx: selection.fx,
    compressor: selection.compressor,
    eq: selection.eq,
    echo: selection.echo,
    reverb: selection.reverb,
  };
}

type StoredEditChainLike = StoredEditChain | null | {
  version?: number;
  cleanVoice?: unknown;
  fx?: unknown;
  autotune?: unknown;
  compressor?: unknown;
  eq?: unknown;
  echo?: unknown;
  reverb?: unknown;
};

function hasStoredChipFields(stored: NonNullable<StoredEditChainLike>): boolean {
  return (
    stored.cleanVoice != null ||
    stored.fx != null ||
    stored.compressor != null ||
    stored.eq != null ||
    stored.echo != null ||
    stored.reverb != null
  );
}

function parseStoredVersion(stored: NonNullable<StoredEditChainLike>): EditChainSelection {
  const mix = parseMixSelections(stored);

  if (stored.version === 7) {
    return {
      cleanVoice: Boolean(stored.cleanVoice),
      fx: parseFx(stored.fx),
      ...mix,
    };
  }

  // v4–v6: drop legacy Autotune chip; keep FX + mix.
  if (stored.version === 6 || stored.version === 5 || stored.version === 4) {
    return {
      cleanVoice: Boolean(stored.cleanVoice),
      fx: parseFx(stored.fx),
      ...mix,
    };
  }

  if (stored.version === 3) {
    return {
      cleanVoice: Boolean(stored.cleanVoice),
      fx: migrateV3Fx(stored.fx),
      ...mix,
    };
  }

  if (stored.version === 2) {
    return {
      cleanVoice: Boolean(stored.cleanVoice),
      fx: migrateV2Fx(stored.fx),
      ...mix,
    };
  }

  if (stored.version === 1) {
    return {
      cleanVoice: Boolean(stored.cleanVoice),
      fx: null,
      ...mix,
    };
  }

  return { ...EMPTY_EDIT_CHAIN };
}

export function fromStoredEditChain(stored?: StoredEditChainLike): EditChainSelection {
  if (!stored || typeof stored !== 'object') {
    return { ...EMPTY_EDIT_CHAIN };
  }

  if (typeof stored.version === 'number') {
    return parseStoredVersion(stored);
  }

  if (hasStoredChipFields(stored)) {
    return {
      cleanVoice: Boolean(stored.cleanVoice),
      fx: parseFx(stored.fx),
      ...parseMixSelections(stored),
    };
  }

  return { ...EMPTY_EDIT_CHAIN };
}

export function isStoredEditChainEmpty(stored?: StoredEditChain | null): boolean {
  return isEditChainEmpty(fromStoredEditChain(stored));
}

export function normalizeStoredEditChain(
  stored?: StoredEditChain | null | {
    version?: number;
    cleanVoice?: unknown;
    fx?: unknown;
    autotune?: unknown;
    compressor?: unknown;
    eq?: unknown;
    echo?: unknown;
    reverb?: unknown;
  },
): StoredEditChain | undefined {
  const selection = fromStoredEditChain(stored);
  return toStoredEditChain(selection);
}
