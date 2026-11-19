import { normalizeStoredEditChain } from '@/features/audio/domain/edit-chain-persistence';
import type { StoredEditChain } from '@/features/audio/types/edit-chips';

import type { AppliedEffect } from '../types';

const EDIT_CHAIN_META = 'editChain.v7';
const CAPTURE_FX_META = 'captureFx.v7';

/**
 * Pack local edit chips into AppliedEffect params (string payload) so draft
 * create/update + restore can round-trip FX without a schema migration.
 */
export function encodeLayerFxMeta(input: {
  editChain?: StoredEditChain | null;
  captureFx?: StoredEditChain | null;
}): AppliedEffect[] {
  const effects: AppliedEffect[] = [];
  const editChain = normalizeStoredEditChain(input.editChain);
  if (editChain) {
    effects.push({
      id: 'modulate',
      params: {
        __meta: EDIT_CHAIN_META,
        data: JSON.stringify(editChain),
      },
    });
  }
  const captureFx = normalizeStoredEditChain(input.captureFx);
  if (captureFx) {
    effects.push({
      id: 'modulate',
      params: {
        __meta: CAPTURE_FX_META,
        data: JSON.stringify(captureFx),
      },
    });
  }
  return effects;
}

export function decodeLayerFxMeta(appliedEffects: unknown): {
  editChain?: StoredEditChain;
  captureFx?: StoredEditChain;
} {
  if (!Array.isArray(appliedEffects)) {
    return {};
  }

  let editChain: StoredEditChain | undefined;
  let captureFx: StoredEditChain | undefined;

  for (const entry of appliedEffects) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    const params = (entry as AppliedEffect).params;
    if (!params || typeof params !== 'object') {
      continue;
    }
    const meta = params.__meta;
    const data = params.data;
    if (typeof meta !== 'string' || typeof data !== 'string') {
      continue;
    }
    try {
      const parsed = JSON.parse(data) as StoredEditChain;
      if (meta === EDIT_CHAIN_META) {
        editChain = normalizeStoredEditChain(parsed);
      } else if (meta === CAPTURE_FX_META) {
        captureFx = normalizeStoredEditChain(parsed);
      }
    } catch {
      // Ignore corrupt payloads from older clients.
    }
  }

  return { editChain, captureFx };
}
