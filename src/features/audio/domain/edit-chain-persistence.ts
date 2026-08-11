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
  AUTOTUNE_SCALES,
  AUTOTUNE_SPEEDS,
  COMPRESSOR_PRESETS,
  ECHO_PRESETS,
  EMPTY_EDIT_CHAIN,
  EQ_PRESETS,
  FX_PRESETS,
  isEditChainEmpty,
  REVERB_PRESETS,
  type AutotuneScaleId,
  type AutotuneSelection,
  type AutotuneSpeedId,
  type CompressorPresetId,
  type CompressorSelection,
  type EchoPresetId,
  type EchoSelection,
  type EditChainSelection,
  type EqPresetId,
  type EqSelection,
  type FxPresetId,
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

function isAutotuneScaleId(value: unknown): value is AutotuneScaleId {
  return AUTOTUNE_SCALES.some((item) => item.id === value);
}

function isAutotuneSpeedId(value: unknown): value is AutotuneSpeedId {
  return AUTOTUNE_SPEEDS.some((item) => item.id === value);
}

function isFxPresetId(value: unknown): value is FxPresetId {
  return FX_PRESETS.some((item) => item.id === value);
}

function parseAutotune(value: unknown): AutotuneSelection | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<AutotuneSelection>;
  if (!isAutotuneScaleId(candidate.scale) || !isAutotuneSpeedId(candidate.speed)) {
    return null;
  }

  return {
    scale: candidate.scale,
    speed: candidate.speed,
  };
}

function parseFx(value: unknown): FxSelection | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<FxSelection> & { params?: unknown };
  if (!isFxPresetId(candidate.preset) || !isAutotuneScaleId(candidate.scale)) {
    return null;
  }

  const rawParams =
    candidate.params && typeof candidate.params === 'object'
      ? (candidate.params as Partial<FxSelection['params']>)
      : defaultFxParams(candidate.preset);

  return {
    preset: candidate.preset,
    scale: candidate.scale,
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
  if (value === 'soft-plate') {
    return 'small-club';
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

/** Migrate v2 fx { preset, scale } → fx + optional autotune mirror. */
function migrateV2Fx(value: unknown): {
  fx: FxSelection | null;
  autotune: AutotuneSelection | null;
} {
  const fx = parseFx(value);
  if (!fx) {
    return { fx: null, autotune: null };
  }

  return {
    fx,
    autotune: {
      scale: fx.scale,
      speed: fx.preset === 'hard-snap' ? 'extreme' : 'subtle',
    },
  };
}

/** Migrate v3 fx preset-only → { preset, scale from autotune or c-major }. */
function migrateV3Fx(
  fxValue: unknown,
  autotuneValue: unknown,
): FxSelection | null {
  if (!isFxPresetId(fxValue)) {
    return null;
  }

  const autotune = parseAutotune(autotuneValue);
  return {
    preset: fxValue,
    scale: autotune?.scale ?? 'c-major',
    params: defaultFxParams(fxValue),
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
    version: 6,
    cleanVoice: selection.cleanVoice,
    autotune: selection.autotune,
    fx: selection.fx,
    compressor: selection.compressor,
    eq: selection.eq,
    echo: selection.echo,
    reverb: selection.reverb,
  };
}

export function fromStoredEditChain(stored?: StoredEditChain | null | {
  version?: number;
  cleanVoice?: unknown;
  fx?: unknown;
  autotune?: unknown;
  compressor?: unknown;
  eq?: unknown;
  echo?: unknown;
  reverb?: unknown;
}): EditChainSelection {
  if (!stored || typeof stored.version !== 'number') {
    return { ...EMPTY_EDIT_CHAIN };
  }

  const mix = parseMixSelections(stored);

  if (stored.version === 6) {
    return {
      cleanVoice: Boolean(stored.cleanVoice),
      autotune: parseAutotune(stored.autotune),
      fx: parseFx(stored.fx),
      ...mix,
    };
  }

  // v4–v5: preset ids only (or legacy strings); attach default tune params.
  if (stored.version === 5 || stored.version === 4) {
    return {
      cleanVoice: Boolean(stored.cleanVoice),
      autotune: parseAutotune(stored.autotune),
      fx: parseFx(stored.fx),
      ...mix,
    };
  }

  if (stored.version === 3) {
    return {
      cleanVoice: Boolean(stored.cleanVoice),
      autotune: parseAutotune(stored.autotune),
      fx: migrateV3Fx(stored.fx, stored.autotune),
      ...mix,
    };
  }

  if (stored.version === 2) {
    const migrated = migrateV2Fx(stored.fx);
    return {
      cleanVoice: Boolean(stored.cleanVoice),
      autotune: migrated.autotune,
      fx: migrated.fx,
      ...mix,
    };
  }

  if (stored.version === 1) {
    return {
      cleanVoice: Boolean(stored.cleanVoice),
      autotune: parseAutotune(stored.autotune),
      fx: null,
      ...mix,
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
