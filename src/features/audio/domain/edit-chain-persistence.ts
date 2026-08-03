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
  type EchoPresetId,
  type EditChainSelection,
  type EqPresetId,
  type FxPresetId,
  type FxSelection,
  type ReverbPresetId,
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

  const candidate = value as Partial<FxSelection>;
  if (!isFxPresetId(candidate.preset) || !isAutotuneScaleId(candidate.scale)) {
    return null;
  }

  return {
    preset: candidate.preset,
    scale: candidate.scale,
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
  };
}

function parseCommonPresets(stored: {
  compressor?: unknown;
  eq?: unknown;
  echo?: unknown;
  reverb?: unknown;
}): Pick<EditChainSelection, 'compressor' | 'eq' | 'echo' | 'reverb'> {
  return {
    compressor: migrateCompressorPresetId(stored.compressor),
    eq: migrateEqPresetId(stored.eq),
    echo: migrateEchoPresetId(stored.echo),
    reverb: migrateReverbPresetId(stored.reverb),
  };
}

export function toStoredEditChain(
  selection: EditChainSelection,
): StoredEditChain | undefined {
  if (isEditChainEmpty(selection)) {
    return undefined;
  }

  return {
    version: 5,
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

  const common = parseCommonPresets(stored);

  // v4–v5: same pitch shape; v5 uses Voloco mix preset ids (migrated above).
  if (stored.version === 5 || stored.version === 4) {
    return {
      cleanVoice: Boolean(stored.cleanVoice),
      autotune: parseAutotune(stored.autotune),
      fx: parseFx(stored.fx),
      ...common,
    };
  }

  if (stored.version === 3) {
    return {
      cleanVoice: Boolean(stored.cleanVoice),
      autotune: parseAutotune(stored.autotune),
      fx: migrateV3Fx(stored.fx, stored.autotune),
      ...common,
    };
  }

  if (stored.version === 2) {
    const migrated = migrateV2Fx(stored.fx);
    return {
      cleanVoice: Boolean(stored.cleanVoice),
      autotune: migrated.autotune,
      fx: migrated.fx,
      ...common,
    };
  }

  if (stored.version === 1) {
    return {
      cleanVoice: Boolean(stored.cleanVoice),
      autotune: parseAutotune(stored.autotune),
      fx: null,
      ...common,
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
